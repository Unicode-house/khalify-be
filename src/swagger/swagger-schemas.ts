import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════
// KHALIFY API — Swagger Schema Definitions
// These classes are used ONLY for Swagger documentation rendering.
// They mirror the enterprise JSON-API envelope interfaces.
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// ENVELOPE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────

export class ApiStatusSchema {
  @ApiProperty({ example: 200, description: 'HTTP status code mirrored in body' })
  code: number;

  @ApiProperty({ example: 'SUCCESS', enum: ['SUCCESS', 'ERROR', 'PARTIAL'], description: 'Machine-readable status type' })
  type: string;

  @ApiProperty({ example: 'Request processed successfully', description: 'Human-readable status message' })
  message: string;
}

export class ApiMetaSchema {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'Unique UUID v4 correlation ID for request tracing' })
  requestId: string;

  @ApiProperty({ example: '2026-05-17T13:02:34.456Z', description: 'ISO 8601 extended format timestamp (UTC)' })
  timestamp: string;

  @ApiProperty({ example: '2.0.0', description: 'API version identifier' })
  apiVersion: string;

  @ApiPropertyOptional({ example: 42, description: 'Server processing time in milliseconds' })
  responseTimeMs?: number;

  @ApiPropertyOptional({ type: () => ApiPaginationSchema, description: 'Pagination metadata (present only for collection endpoints)' })
  pagination?: ApiPaginationSchema;
}

export class ApiPaginationSchema {
  @ApiProperty({ example: 1, description: 'Current page number (1-indexed)' })
  currentPage: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  pageSize: number;

  @ApiProperty({ example: 42, description: 'Total number of items across all pages' })
  totalItems: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Whether a next page exists' })
  hasNextPage: boolean;

  @ApiProperty({ example: false, description: 'Whether a previous page exists' })
  hasPreviousPage: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// SUCCESS RESPONSE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────

export class ApiSuccessResponseSchema {
  @ApiProperty({ type: ApiStatusSchema })
  status: ApiStatusSchema;

  @ApiProperty({ description: 'Response data payload (varies per endpoint)', example: {} })
  data: any;

  @ApiProperty({ type: ApiMetaSchema })
  meta: ApiMetaSchema;
}

export class ApiCollectionDataSchema {
  @ApiProperty({ description: 'Array of resource items', type: [Object] })
  items: any[];

  @ApiProperty({ example: 10, description: 'Number of items in this response' })
  count: number;
}

export class ApiCollectionResponseSchema {
  @ApiProperty({ type: ApiStatusSchema })
  status: ApiStatusSchema;

  @ApiProperty({ type: ApiCollectionDataSchema, description: 'Collection data with items array and count' })
  data: ApiCollectionDataSchema;

  @ApiProperty({ type: ApiMetaSchema })
  meta: ApiMetaSchema;
}

// ─────────────────────────────────────────────────────────────────────────
// ERROR RESPONSE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────

export class ApiFieldErrorSchema {
  @ApiProperty({ example: 'email', description: 'Field name that caused the violation' })
  field: string;

  @ApiProperty({ example: 'INVALID_VALUE', description: 'Machine-readable constraint code' })
  code: string;

  @ApiProperty({ example: 'email must be a valid email address', description: 'Human-readable error description' })
  message: string;
}

export class ApiErrorDataSchema {
  @ApiProperty({ example: 'VALIDATION_FAILED', description: 'Machine-readable error code' })
  errorCode: string;

  @ApiProperty({
    example: 'VALIDATION_ERROR',
    enum: [
      'VALIDATION_ERROR', 'AUTHENTICATION_ERROR', 'AUTHORIZATION_ERROR',
      'RESOURCE_NOT_FOUND', 'CONFLICT_ERROR', 'RATE_LIMIT_ERROR',
      'BUSINESS_LOGIC_ERROR', 'INTERNAL_ERROR', 'SERVICE_UNAVAILABLE',
    ],
    description: 'Error category classification',
  })
  errorType: string;

  @ApiProperty({ example: 'Validation failed. Please check the submitted data.', description: 'Human-readable error description' })
  message: string;

  @ApiPropertyOptional({ type: [ApiFieldErrorSchema], description: 'Field-level violation details (validation errors only)' })
  fieldErrors?: ApiFieldErrorSchema[];

  @ApiPropertyOptional({ example: 'The provided email is already registered.', description: 'Additional context without exposing internals' })
  details?: string;
}

export class ApiErrorResponseSchema {
  @ApiProperty({ type: ApiStatusSchema, example: { code: 400, type: 'ERROR', message: 'Validation failed' } })
  status: ApiStatusSchema;

  @ApiProperty({ type: ApiErrorDataSchema })
  data: ApiErrorDataSchema;

  @ApiProperty({ type: ApiMetaSchema })
  meta: ApiMetaSchema;
}
