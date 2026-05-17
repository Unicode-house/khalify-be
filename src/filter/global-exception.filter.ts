import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseHelper } from '../helper/base.response';

// ═══════════════════════════════════════════════════════════════════════════
// KHALIFY API — Global HTTP Exception Filter
// Catches ALL exceptions and formats them into enterprise JSON-API spec.
// NEVER exposes raw database stack traces or internal error details.
// ═══════════════════════════════════════════════════════════════════════════

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract request ID from header (set by middleware) or generate one
    const requestId =
      (request.headers['x-request-id'] as string) || undefined;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred. Please try again later.';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let fieldErrors: any[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;

        // Handle NestJS ValidationPipe errors (class-validator)
        if (Array.isArray(res.message)) {
          message = 'Validation failed. Please check the submitted data.';
          fieldErrors = res.message.map((msg: string) => {
            // Parse class-validator message format: "field constraint"
            const parts = msg.split(' ');
            const field = parts[0] || 'unknown';
            return {
              field,
              code: 'INVALID_VALUE',
              message: msg,
            };
          });
          errorCode = 'VALIDATION_FAILED';
        } else {
          message = res.message || res.error || message;
          errorCode = res.code || res.error?.replace(/\s+/g, '_').toUpperCase() || this.resolveErrorCode(statusCode);
        }
      }
    } else if (exception instanceof Error) {
      // Log the actual error internally for debugging
      this.logger.error(
        `[${requestId}] Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
      // NEVER expose raw error message to client
      message = 'An unexpected error occurred. Please try again later.';
      errorCode = 'INTERNAL_SERVER_ERROR';
    }

    const errorResponse = ResponseHelper.error(
      message,
      statusCode,
      errorCode,
      {
        fieldErrors,
        requestId,
        errorType: undefined, // Let ResponseHelper resolve from statusCode
      },
    );

    response.status(statusCode).json(errorResponse);
  }

  private resolveErrorCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'RESOURCE_NOT_FOUND';
      case 405:
        return 'METHOD_NOT_ALLOWED';
      case 409:
        return 'RESOURCE_CONFLICT';
      case 422:
        return 'VALIDATION_FAILED';
      case 429:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
