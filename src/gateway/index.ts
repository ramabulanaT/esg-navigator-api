/**
 * API Gateway Entry Point
 * Exports gateway instance and configuration
 */

import { APIGateway } from './api-gateway';

// Create and export gateway instance with default configuration
export const gateway = new APIGateway({
  enableCaching: process.env.ENABLE_CACHING !== 'false',
  cacheTTL: parseInt(process.env.CACHE_TTL || '300000', 10),
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  enableLogging: process.env.ENABLE_LOGGING !== 'false',
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
});

export { APIGateway } from './api-gateway';
export default gateway;

// Made with Bob
