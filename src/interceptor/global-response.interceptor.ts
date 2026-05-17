import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '../interface/baseResponse.interface';

// ═══════════════════════════════════════════════════════════════════════════
// KHALIFY API — Global Response Interceptor
// Automatically wraps all controller responses into the enterprise
// JSON-API envelope pattern. If a response is already wrapped (has
// 'status' object), it passes through untouched.
// ═══════════════════════════════════════════════════════════════════════════

@Injectable()
export class GlobalResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId =
      (request.headers['x-request-id'] as string) || undefined;

    const startTime = Date.now();

    return next.handle().pipe(
      map((responseData) => {
        const responseTimeMs = Date.now() - startTime;

        // If the response is already in our envelope format, enrich and pass through
        if (this.isAlreadyWrapped(responseData)) {
          // Inject requestId and responseTime if not present
          if (responseData.meta) {
            if (requestId && !responseData.meta.requestId) {
              responseData.meta.requestId = requestId;
            }
            responseData.meta.responseTimeMs = responseTimeMs;
          }
          return responseData;
        }

        // Determine HTTP status code
        const httpContext = context.switchToHttp().getResponse();
        const statusCode: number =
          httpContext.statusCode || HttpStatus.OK;

        // Auto-wrap raw responses into enterprise envelope
        return {
          status: {
            code: statusCode,
            type: 'SUCCESS' as const,
            message: 'Request processed successfully',
          },
          data: responseData,
          meta: {
            requestId:
              requestId ||
              require('crypto').randomUUID(),
            timestamp: new Date().toISOString(),
            apiVersion: '2.0.0',
            responseTimeMs,
          },
        } as ApiResponse<T>;
      }),
    );
  }

  /**
   * Check if the response is already wrapped in our enterprise envelope format.
   */
  private isAlreadyWrapped(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.status &&
      typeof data.status === 'object' &&
      typeof data.status.code === 'number' &&
      typeof data.status.type === 'string' &&
      data.meta &&
      typeof data.meta === 'object'
    );
  }
}
