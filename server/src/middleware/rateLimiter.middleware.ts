import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseFormatter';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipInTest?: boolean;
}) {
  const store = new Map<string, RateLimitRecord>();

  const windowMs = options.windowMs;
  const maxRequests = options.max;
  const message = options.message || 'Too many requests from this IP, please try again later.';
  const skipInTest = options.skipInTest ?? false;

  // Cleanup expired entries periodically (every 5 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    if (skipInTest && process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    let record = store.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      return sendError(
        res,
        message,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_CODES.RATE_LIMITED,
        { retryAfterSeconds: resetSeconds }
      );
    }

    next();
  };
}

// 1. Auth Rate Limiter (Brute-force protection for login/register)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  skipInTest: true,
});

// 2. General API Rate Limiter
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute
  message: 'API rate limit exceeded. Please throttle your requests.',
  skipInTest: true,
});
