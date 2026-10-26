import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Envizi API Service
 * Handles all interactions with IBM Envizi ESG Suite API
 */

interface EnviziConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  s3AccessKeyId?: string;
  s3SecretKey?: string;
  s3Bucket?: string;
}

interface EnviziAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

interface EnviziESGMetric {
  id: string;
  company_id: string;
  ticker: string;
  report_date: string;
  data_type: string;
  category: string;
  subcategory?: string;
  metric_name: string;
  metric_value: number | null;
  unit: string;
  scope?: string;
  data_quality_score?: number;
  confidence_level?: string;
  source: string;
  verification_status: string;
  notes?: string;
}

interface EnviziCompletenessResult {
  company_id: string;
  ticker: string;
  completeness_score: number;
  total_metrics: number;
  populated_metrics: number;
  missing_metrics: number;
  quality_score: number;
  scopes_covered: number;
  missing_data_points: string[];
  recommendations: string[];
}

interface EnviziGHGEmissions {
  company_id: string;
  ticker: string;
  report_date: string;
  scope1: {
    value: number;
    unit: string;
    confidence: number;
    sources: string[];
  };
  scope2: {
    value: number;
    unit: string;
    confidence: number;
    sources: string[];
  };
  scope3: {
    value: number;
    unit: string;
    confidence: number;
    sources: string[];
    categories: Record<string, number>;
  };
  total: number;
  verification_status: string;
}

export class EnviziService {
  private client: AxiosInstance;
  private config: EnviziConfig;
  private authToken: EnviziAuthToken | null = null;

  constructor(config?: Partial<EnviziConfig>) {
    this.config = {
      apiUrl: config?.apiUrl || process.env.ENVIZI_API_URL || 'https://api.envizi.com/v1',
      clientId: config?.clientId || process.env.ENVIZI_CLIENT_ID || '',
      clientSecret: config?.clientSecret || process.env.ENVIZI_CLIENT_SECRET || '',
      s3AccessKeyId: config?.s3AccessKeyId || process.env.ENVIZI_S3_ACCESS_KEY_ID,
      s3SecretKey: config?.s3SecretKey || process.env.ENVIZI_S3_SECRET_KEY,
      s3Bucket: config?.s3Bucket || process.env.ENVIZI_S3_BUCKET,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ESG-Navigator/1.0',
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getValidToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          this.authToken = null;
          const token = await this.getValidToken();
          if (token && error.config) {
            error.config.headers.Authorization = `Bearer ${token.access_token}`;
            return this.client.request(error.config);
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Get or refresh authentication token
   */
  private async getValidToken(): Promise<EnviziAuthToken | null> {
    // Check if we have a valid token
    if (this.authToken && this.authToken.expires_at > Date.now()) {
      return this.authToken;
    }

    // Get new token
    try {
      const response = await axios.post(
        `${this.config.apiUrl}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      this.authToken = {
        ...response.data,
        expires_at: Date.now() + (response.data.expires_in - 60) * 1000, // Subtract 60s buffer
      };

      return this.authToken;
    } catch (error) {
      console.error('Failed to authenticate with Envizi:', error);
      return null;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      return new Error(
        `Envizi API Error (${status}): ${data?.message || data?.error || error.message}`
      );
    } else if (error.request) {
      return new Error('No response from Envizi API. Please check network connectivity.');
    } else {
      return new Error(`Request setup error: ${error.message}`);
    }
  }

  /**
   * Get ESG data completeness for a company
   */
  async getCompleteness(
    ticker: string,
    reportDate?: string
  ): Promise<EnviziCompletenessResult> {
    try {
      const params: any = { ticker };
      if (reportDate) {
        params.report_date = reportDate;
      }

      const response = await this.client.get('/completeness', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get completeness data: ${(error as Error).message}`);
    }
  }

  /**
   * Get GHG emissions data for a company
   */
  async getGHGEmissions(
    ticker: string,
    scopeFilter?: string,
    includeConfidence: boolean = true
  ): Promise<EnviziGHGEmissions> {
    try {
      const params: any = { 
        ticker,
        include_confidence: includeConfidence 
      };
      
      if (scopeFilter) {
        params.scope_filter = scopeFilter;
      }

      const response = await this.client.get('/emissions/ghg', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get GHG emissions: ${(error as Error).message}`);
    }
  }

  /**
   * Get all ESG metrics for a company
   */
  async getESGMetrics(
    ticker: string,
    dateRange?: { start: string; end: string }
  ): Promise<EnviziESGMetric[]> {
    try {
      const params: any = { ticker };
      if (dateRange) {
        params.start_date = dateRange.start;
        params.end_date = dateRange.end;
      }

      const response = await this.client.get('/metrics', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get ESG metrics: ${(error as Error).message}`);
    }
  }

  /**
   * Submit ESG data to Envizi
   */
  async submitESGData(data: Partial<EnviziESGMetric>[]): Promise<{ success: boolean; ids: string[] }> {
    try {
      const response = await this.client.post('/metrics', { metrics: data });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to submit ESG data: ${(error as Error).message}`);
    }
  }

  /**
   * Get data quality report
   */
  async getDataQualityReport(ticker: string): Promise<any> {
    try {
      const response = await this.client.get(`/quality-report/${ticker}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get quality report: ${(error as Error).message}`);
    }
  }

  /**
   * Export data to S3
   */
  async exportToS3(
    ticker: string,
    format: 'csv' | 'json' | 'excel' = 'csv'
  ): Promise<{ success: boolean; s3_url: string }> {
    try {
      const response = await this.client.post('/export', {
        ticker,
        format,
        destination: {
          type: 's3',
          bucket: this.config.s3Bucket,
          access_key_id: this.config.s3AccessKeyId,
          secret_key: this.config.s3SecretKey,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to export data: ${(error as Error).message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${(error as Error).message}`);
    }
  }
}

// Singleton instance
let enviziServiceInstance: EnviziService | null = null;

export function getEnviziService(): EnviziService {
  if (!enviziServiceInstance) {
    enviziServiceInstance = new EnviziService();
  }
  return enviziServiceInstance;
}

export default EnviziService;

// Made with Bob
