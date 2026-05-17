// ═══════════════════════════════════════════════════════════════════════════
// KHALIFY API — Enterprise JSON-API Response Specification v2.0
// Architecture: Envelope Pattern (Google/Microsoft Standard)
// Convention: Strict camelCase | ISO 8601 Extended Format (UTC)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Root envelope for ALL API responses.
 * Every response — success or error — is wrapped in this structure.
 */
export interface ApiResponse<T = any> {
  /** Top-level status indicator following the envelope pattern */
  status: ApiStatus;

  /** Primary data payload (null on error responses) */
  data: T | null;

  /** Contextual metadata for the response */
  meta: ApiMeta;

  /** Hypermedia links for resource navigation (HATEOAS) */
  links?: ApiLinks;
}

/**
 * Envelope status object — always present at root level.
 */
export interface ApiStatus {
  /** HTTP status code mirrored in body for client convenience */
  code: number;

  /** Machine-readable status: 'SUCCESS' | 'ERROR' | 'PARTIAL' */
  type: ApiStatusType;

  /** Human-readable status message */
  message: string;
}

export type ApiStatusType = 'SUCCESS' | 'ERROR' | 'PARTIAL';

/**
 * Metadata isolation layer — separates concerns from data payload.
 */
export interface ApiMeta {
  /** Unique correlation ID for request tracing */
  requestId: string;

  /** ISO 8601 extended format timestamp with UTC offset */
  timestamp: string;

  /** API version identifier */
  apiVersion: string;

  /** Response time in milliseconds */
  responseTimeMs?: number;

  /** Pagination metadata (present only for collection responses) */
  pagination?: ApiPagination;
}

/**
 * Pagination metadata following cursor-based and offset patterns.
 */
export interface ApiPagination {
  /** Current page number (1-indexed) */
  currentPage: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of items across all pages */
  totalItems: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there is a next page available */
  hasNextPage: boolean;

  /** Whether there is a previous page available */
  hasPreviousPage: boolean;
}

/**
 * HATEOAS-compliant navigation links.
 */
export interface ApiLinks {
  /** Canonical URL of the current resource */
  self?: string;

  /** URL to the first page (paginated resources) */
  first?: string;

  /** URL to the previous page */
  previous?: string;

  /** URL to the next page */
  next?: string;

  /** URL to the last page */
  last?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR RESPONSE SPECIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Structured error payload — replaces data field on error responses.
 * Never exposes raw database stack traces.
 */
export interface ApiErrorPayload {
  /** Machine-readable error code (e.g., 'RESOURCE_NOT_FOUND', 'VALIDATION_FAILED') */
  errorCode: string;

  /** Error category classification */
  errorType: ApiErrorType;

  /** Human-readable error description */
  message: string;

  /** Field-level violation details (for validation errors) */
  fieldErrors?: ApiFieldError[];

  /** Contextual details without exposing internals */
  details?: string;

  /** Documentation reference URL */
  helpUrl?: string;
}

export type ApiErrorType =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'BUSINESS_LOGIC_ERROR'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

/**
 * Field-level violation mapping for structured validation errors.
 */
export interface ApiFieldError {
  /** The field name that caused the violation */
  field: string;

  /** Machine-readable constraint code */
  code: string;

  /** Human-readable description of the violation */
  message: string;

  /** The rejected value (sanitized, never raw DB values) */
  rejectedValue?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// COLLECTION RESPONSE SPECIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Typed wrapper for collection (list) responses with item count.
 */
export interface ApiCollectionData<T> {
  /** Array of resource items */
  items: T[];

  /** Number of items in this response */
  count: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY (Deprecated — will be removed in v3.0)
// ═══════════════════════════════════════════════════════════════════════════

/** @deprecated Use ApiResponse instead */
export interface BaseResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta?: MetaResponse;
  error?: ErrorResponse;
  timestamp: string;
  requestId?: string;
}

/** @deprecated Use ApiPagination instead */
export interface MetaResponse {
  page?: number;
  limit?: number;
  totalData?: number;
  totalPage?: number;
}

/** @deprecated Use ApiErrorPayload instead */
export interface ErrorResponse {
  code: string;
  details?: string | string[];
}
