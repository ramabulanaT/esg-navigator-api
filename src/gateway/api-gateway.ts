import express, { Request, Response, NextFunction, Router } from 'express';
import { getEnviziService } from '../services/envizi.service';
import { getWatsonxService } from '../services/watsonx.service';

/**
 * API Gateway Layer
 * Provides unified interface for Envizi and watsonx Orchestrate services
 * Handles routing, authentication, rate limiting, caching, and transformation
 */

interface GatewayConfig {
  enableCaching: boolean;
  cacheTTL: number;
  enableRateLimiting: boolean;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  enableLogging: boolean;
  enableMetrics: boolean;
}

interface GatewayRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  startTime?: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export class APIGateway {
  private router: Router;
  private config: GatewayConfig;
  private cache: Map<string, CacheEntry>;
  private rateLimitStore: Map<string, { count: number; resetTime: number }>;
  private enviziService = getEnviziService();
  private watsonxService = getWatsonxService();

  constructor(config?: Partial<GatewayConfig>) {
    this.router = express.Router();
    this.cache = new Map();
    this.rateLimitStore = new Map();
    
    this.config = {
      enableCaching: config?.enableCaching ?? true,
      cacheTTL: config?.cacheTTL ?? 300000, // 5 minutes
      enableRateLimiting: config?.enableRateLimiting ?? true,
      rateLimit: {
        windowMs: config?.rateLimit?.windowMs ?? 60000, // 1 minute
        maxRequests: config?.rateLimit?.maxRequests ?? 100,
      },
      enableLogging: config?.enableLogging ?? true,
      enableMetrics: config?.enableMetrics ?? true,
    };

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup gateway middleware
   */
  private setupMiddleware(): void {
    // Request timing
    this.router.use((req: GatewayRequest, res: Response, next: NextFunction) => {
      req.startTime = Date.now();
      next();
    });

    // Logging middleware
    if (this.config.enableLogging) {
      this.router.use(this.loggingMiddleware.bind(this));
    }

    // Rate limiting middleware
    if (this.config.enableRateLimiting) {
      this.router.use(this.rateLimitMiddleware.bind(this));
    }

    // Response timing
    this.router.use((req: GatewayRequest, res: Response, next: NextFunction) => {
      res.on('finish', () => {
        const duration = Date.now() - (req.startTime || Date.now());
        res.setHeader('X-Response-Time', `${duration}ms`);
      });
      next();
    });
  }

  /**
   * Logging middleware
   */
  private loggingMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void {
    const { method, path, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';
    
    console.log(`[Gateway] ${method} ${path} - IP: ${ip} - UA: ${userAgent}`);
    next();
  }

  /**
   * Rate limiting middleware
   */
  private rateLimitMiddleware(req: GatewayRequest, res: Response, next: NextFunction): void {
    const clientId = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    
    let clientData = this.rateLimitStore.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 0,
        resetTime: now + this.config.rateLimit.windowMs,
      };
      this.rateLimitStore.set(clientId, clientData);
    }
    
    clientData.count++;
    
    if (clientData.count > this.config.rateLimit.maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
      return;
    }
    
    res.setHeader('X-RateLimit-Limit', this.config.rateLimit.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (this.config.rateLimit.maxRequests - clientData.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
    
    next();
  }

  /**
   * Cache middleware
   */
  private getCachedData(key: string): any | null {
    if (!this.config.enableCaching) {
      return null;
    }
    
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cache data
   */
  private setCachedData(key: string, data: any, ttl?: number): void {
    if (!this.config.enableCaching) {
      return;
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL,
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.router.get('/health', this.handleHealthCheck.bind(this));
    
    // Envizi routes
    this.router.post('/envizi/completeness', this.handleEnviziCompleteness.bind(this));
    this.router.post('/envizi/ghg-emissions', this.handleEnviziGHGEmissions.bind(this));
    this.router.post('/envizi/metrics', this.handleEnviziMetrics.bind(this));
    this.router.post('/envizi/quality-report', this.handleEnviziQualityReport.bind(this));
    this.router.post('/envizi/export', this.handleEnviziExport.bind(this));
    
    // watsonx Orchestrate routes
    this.router.post('/watsonx/skills/register', this.handleWatsonxRegisterSkill.bind(this));
    this.router.post('/watsonx/skills/:skillId/invoke', this.handleWatsonxInvokeSkill.bind(this));
    this.router.post('/watsonx/workflows/create', this.handleWatsonxCreateWorkflow.bind(this));
    this.router.post('/watsonx/workflows/:workflowId/execute', this.handleWatsonxExecuteWorkflow.bind(this));
    
    // Combined operations
    this.router.post('/assess/completeness', this.handleAssessCompleteness.bind(this));
    this.router.post('/assess/full-report', this.handleFullReport.bind(this));
  }

  /**
   * Health check handler
   */
  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const [enviziHealth, watsonxHealth] = await Promise.allSettled([
        this.enviziService.healthCheck(),
        this.watsonxService.healthCheck(),
      ]);
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          envizi: enviziHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
          watsonx: watsonxHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        },
        cache: {
          enabled: this.config.enableCaching,
          entries: this.cache.size,
        },
        rateLimit: {
          enabled: this.config.enableRateLimiting,
          clients: this.rateLimitStore.size,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Envizi completeness handler
   */
  private async handleEnviziCompleteness(req: Request, res: Response): Promise<void> {
    try {
      const { ticker, report_date } = req.body;
      
      if (!ticker) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: ticker',
          code: 'MISSING_PARAMETER',
        });
        return;
      }
      
      const cacheKey = `envizi:completeness:${ticker}:${report_date || 'current'}`;
      const cached = this.getCachedData(cacheKey);
      
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.json({
          success: true,
          data: cached,
          cached: true,
        });
        return;
      }
      
      const data = await this.enviziService.getCompleteness(ticker, report_date);
      this.setCachedData(cacheKey, data);
      
      res.setHeader('X-Cache', 'MISS');
      res.json({
        success: true,
        data,
        cached: false,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'ENVIZI_COMPLETENESS_ERROR',
      });
    }
  }

  /**
   * Envizi GHG emissions handler
   */
  private async handleEnviziGHGEmissions(req: Request, res: Response): Promise<void> {
    try {
      const { ticker, scope_filter, include_confidence } = req.body;
      
      if (!ticker) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: ticker',
          code: 'MISSING_PARAMETER',
        });
        return;
      }
      
      const cacheKey = `envizi:ghg:${ticker}:${scope_filter || 'all'}`;
      const cached = this.getCachedData(cacheKey);
      
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.json({
          success: true,
          data: cached,
          cached: true,
        });
        return;
      }
      
      const data = await this.enviziService.getGHGEmissions(ticker, scope_filter, include_confidence);
      this.setCachedData(cacheKey, data);
      
      res.setHeader('X-Cache', 'MISS');
      res.json({
        success: true,
        data,
        cached: false,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'ENVIZI_GHG_ERROR',
      });
    }
  }

  /**
   * Envizi metrics handler
   */
  private async handleEnviziMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { ticker, date_range } = req.body;
      
      if (!ticker) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: ticker',
          code: 'MISSING_PARAMETER',
        });
        return;
      }
      
      const data = await this.enviziService.getESGMetrics(ticker, date_range);
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'ENVIZI_METRICS_ERROR',
      });
    }
  }

  /**
   * Envizi quality report handler
   */
  private async handleEnviziQualityReport(req: Request, res: Response): Promise<void> {
    try {
      const { ticker } = req.body;
      
      if (!ticker) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: ticker',
          code: 'MISSING_PARAMETER',
        });
        return;
      }
      
      const data = await this.enviziService.getDataQualityReport(ticker);
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'ENVIZI_QUALITY_ERROR',
      });
    }
  }

  /**
   * Envizi export handler
   */
  private async handleEnviziExport(req: Request, res: Response): Promise<void> {
    try {
      const { ticker, format } = req.body;
      
      if (!ticker) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: ticker',
          code: 'MISSING_PARAMETER',
        });
        return;
      }
      
      const data = await this.enviziService.exportToS3(ticker, format);
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'ENVIZI_EXPORT_ERROR',
      });
    }
  }

  /**
   * watsonx register skill handler
   */
  private async handleWatsonxRegisterSkill(req: Request, res: Response): Promise<void> {
    try {
      const skill = req.body;
      
      if (!skill.name || !skill.endpoint) {
        res.status(400).json({
          success: false,
          error: 'Missing required skill parameters',
          code: 'MISSING_PARAMETER',
        });
        return;
      }
      
      const data = await this.watsonxService.registerSkill(skill);
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'WATSONX_REGISTER_ERROR',
      });
    }
  }

  /**
   * watsonx invoke skill handler
   */
  private async handleWatsonxInvokeSkill(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;
      const { inputs, context } = req.body;
      
      const data = await this.watsonxService.invokeSkill({
        skill_id: skillId,
        inputs,
        context,
      });
      
      res.json(data);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'WATSONX_INVOKE_ERROR',
      });
    }
  }

  /**
   * watsonx create workflow handler
   */
  private async handleWatsonxCreateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflow = req.body;
      
      if (!workflow.name || !workflow.steps) {
        res.status(400).json({
          success: false,
          error: 'Missing required workflow parameters',
          code: 'MISSING_PARAMETER',
        });
        return;
      }
      
      const data = await this.watsonxService.createWorkflow(workflow);
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'WATSONX_WORKFLOW_CREATE_ERROR',
      });
    }
  }

  /**
   * watsonx execute workflow handler
   */
  private async handleWatsonxExecuteWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const { inputs } = req.body;
      
      const data = await this.watsonxService.executeWorkflow(workflowId, inputs);
      
      res.json(data);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'WATSONX_WORKFLOW_EXECUTE_ERROR',
      });
    }
  }

  /**
   * Combined completeness assessment handler
   */
  private async handleAssessCompleteness(req: Request, res: Response): Promise<void> {
    try {
      const { ticker, report_date } = req.body;
      
      if (!ticker) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: ticker',
          code: 'MISSING_PARAMETER',
        });
        return;
      }
      
      // Get completeness from Envizi
      const completeness = await this.enviziService.getCompleteness(ticker, report_date);
      
      // If completeness is low, trigger watsonx workflow for recommendations
      if (completeness.completeness_score < 80) {
        const workflowResult = await this.watsonxService.executeWorkflow(
          'data-gap-analysis-workflow',
          { ticker, completeness_data: completeness }
        );
        
        res.json({
          success: true,
          data: {
            ...completeness,
            workflow_triggered: true,
            recommendations: workflowResult.results,
          },
        });
      } else {
        res.json({
          success: true,
          data: {
            ...completeness,
            workflow_triggered: false,
          },
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'ASSESS_COMPLETENESS_ERROR',
      });
    }
  }

  /**
   * Full ESG report handler
   */
  private async handleFullReport(req: Request, res: Response): Promise<void> {
    try {
      const { ticker, report_date } = req.body;
      
      if (!ticker) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: ticker',
          code: 'MISSING_PARAMETER',
        });
        return;
      }
      
      // Fetch all data in parallel
      const [completeness, emissions, qualityReport] = await Promise.all([
        this.enviziService.getCompleteness(ticker, report_date),
        this.enviziService.getGHGEmissions(ticker),
        this.enviziService.getDataQualityReport(ticker),
      ]);
      
      res.json({
        success: true,
        data: {
          ticker,
          report_date: report_date || new Date().toISOString().split('T')[0],
          completeness,
          emissions,
          quality: qualityReport,
          generated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'FULL_REPORT_ERROR',
      });
    }
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export default APIGateway;

// Made with Bob
