import { randomUUID } from 'crypto';
import {
  ApiResponse,
  ApiErrorPayload,
  ApiPagination,
  ApiCollectionData,
  ApiLinks,
  ApiStatusType,
  ApiErrorType,
  ApiFieldError,
} from '../interface/baseResponse.interface';

// ═══════════════════════════════════════════════════════════════════════════
// KHALIFY API — Enterprise Response Builder v2.0
// Follows Google/Microsoft JSON-API Envelope Pattern
// ═══════════════════════════════════════════════════════════════════════════

const API_VERSION = '2.0.0';

export class ResponseHelper {
  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS RESPONSES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build a success response with a single resource.
   */
  static success<T>(
    data: T,
    message = 'Request processed successfully',
    statusCode = 200,
    requestId?: string,
  ): ApiResponse<T> {
    return {
      status: {
        code: statusCode,
        type: 'SUCCESS' as ApiStatusType,
        message,
      },
      data,
      meta: {
        requestId: requestId || randomUUID(),
        timestamp: new Date().toISOString(),
        apiVersion: API_VERSION,
      },
    };
  }

  /**
   * Build a success response for resource creation (HTTP 201).
   */
  static created<T>(
    data: T,
    message = 'Resource created successfully',
    requestId?: string,
  ): ApiResponse<T> {
    return ResponseHelper.success(data, message, 201, requestId);
  }

  /**
   * Build a success response for collection/list endpoints with pagination.
   */
  static collection<T>(
    items: T[],
    message = 'Collection retrieved successfully',
    pagination?: ApiPagination,
    links?: ApiLinks,
    requestId?: string,
  ): ApiResponse<ApiCollectionData<T>> {
    const response: ApiResponse<ApiCollectionData<T>> = {
      status: {
        code: 200,
        type: 'SUCCESS' as ApiStatusType,
        message,
      },
      data: {
        items,
        count: items.length,
      },
      meta: {
        requestId: requestId || randomUUID(),
        timestamp: new Date().toISOString(),
        apiVersion: API_VERSION,
      },
    };

    if (pagination) {
      response.meta.pagination = pagination;
    }

    if (links) {
      response.links = links;
    }

    return response;
  }

  /**
   * Build a success response with no content (HTTP 204 semantics in body).
   */
  static noContent(
    message = 'Operation completed successfully',
    requestId?: string,
  ): ApiResponse<null> {
    return {
      status: {
        code: 200,
        type: 'SUCCESS' as ApiStatusType,
        message,
      },
      data: null,
      meta: {
        requestId: requestId || randomUUID(),
        timestamp: new Date().toISOString(),
        apiVersion: API_VERSION,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR RESPONSES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build a structured error response.
   * Never exposes raw database stack traces.
   */
  static error(
    message: string,
    statusCode: number,
    errorCode: string,
    options?: {
      errorType?: ApiErrorType;
      fieldErrors?: ApiFieldError[];
      details?: string;
      requestId?: string;
    },
  ): ApiResponse<ApiErrorPayload> {
    const errorType = options?.errorType || ResponseHelper.resolveErrorType(statusCode);

    return {
      status: {
        code: statusCode,
        type: 'ERROR' as ApiStatusType,
        message,
      },
      data: {
        errorCode,
        errorType,
        message,
        fieldErrors: options?.fieldErrors,
        details: options?.details,
      },
      meta: {
        requestId: options?.requestId || randomUUID(),
        timestamp: new Date().toISOString(),
        apiVersion: API_VERSION,
      },
    };
  }

  /**
   * Build a validation error response with field-level violations.
   */
  static validationError(
    fieldErrors: ApiFieldError[],
    message = 'Validation failed. Please check the submitted data.',
    requestId?: string,
  ): ApiResponse<ApiErrorPayload> {
    return ResponseHelper.error(message, 422, 'VALIDATION_FAILED', {
      errorType: 'VALIDATION_ERROR',
      fieldErrors,
      requestId,
    });
  }

  /**
   * Build an unauthorized error response (HTTP 401).
   */
  static unauthorized(
    message = 'Authentication required. Please provide valid credentials.',
    errorCode = 'UNAUTHORIZED',
    requestId?: string,
  ): ApiResponse<ApiErrorPayload> {
    return ResponseHelper.error(message, 401, errorCode, {
      errorType: 'AUTHENTICATION_ERROR',
      requestId,
    });
  }

  /**
   * Build a forbidden error response (HTTP 403).
   */
  static forbidden(
    message = 'You do not have permission to access this resource.',
    errorCode = 'FORBIDDEN',
    requestId?: string,
  ): ApiResponse<ApiErrorPayload> {
    return ResponseHelper.error(message, 403, errorCode, {
      errorType: 'AUTHORIZATION_ERROR',
      requestId,
    });
  }

  /**
   * Build a not found error response (HTTP 404).
   */
  static notFound(
    message = 'The requested resource was not found.',
    errorCode = 'RESOURCE_NOT_FOUND',
    requestId?: string,
  ): ApiResponse<ApiErrorPayload> {
    return ResponseHelper.error(message, 404, errorCode, {
      errorType: 'RESOURCE_NOT_FOUND',
      requestId,
    });
  }

  /**
   * Build a conflict error response (HTTP 409).
   */
  static conflict(
    message = 'Resource conflict detected.',
    errorCode = 'RESOURCE_CONFLICT',
    requestId?: string,
  ): ApiResponse<ApiErrorPayload> {
    return ResponseHelper.error(message, 409, errorCode, {
      errorType: 'CONFLICT_ERROR',
      requestId,
    });
  }

  /**
   * Build an internal server error response (HTTP 500).
   * NEVER exposes raw stack traces or DB errors.
   */
  static internalError(
    message = 'An unexpected error occurred. Please try again later.',
    requestId?: string,
  ): ApiResponse<ApiErrorPayload> {
    return ResponseHelper.error(message, 500, 'INTERNAL_SERVER_ERROR', {
      errorType: 'INTERNAL_ERROR',
      requestId,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build pagination metadata from query parameters.
   */
  static buildPagination(
    page: number,
    pageSize: number,
    totalItems: number,
  ): ApiPagination {
    const totalPages = Math.ceil(totalItems / pageSize);
    return {
      currentPage: page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Resolve error type from HTTP status code.
   */
  private static resolveErrorType(statusCode: number): ApiErrorType {
    switch (statusCode) {
      case 400:
      case 422:
        return 'VALIDATION_ERROR';
      case 401:
        return 'AUTHENTICATION_ERROR';
      case 403:
        return 'AUTHORIZATION_ERROR';
      case 404:
        return 'RESOURCE_NOT_FOUND';
      case 405:
      case 409:
        return 'CONFLICT_ERROR';
      case 429:
        return 'RATE_LIMIT_ERROR';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return statusCode >= 400 && statusCode < 500
          ? 'BUSINESS_LOGIC_ERROR'
          : 'INTERNAL_ERROR';
    }
  }
}
