import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// KHALIFY API — Request ID Middleware
// Generates a unique correlation ID (UUID v4) for every incoming request.
// Enables distributed tracing and log correlation across services.
// ═══════════════════════════════════════════════════════════════════════════

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing request ID (from load balancer/gateway) or generate new one
    const requestId =
      (req.headers['x-request-id'] as string) || randomUUID();

    // Set on request for downstream consumption
    req.headers['x-request-id'] = requestId;

    // Echo in response headers for client-side correlation
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
