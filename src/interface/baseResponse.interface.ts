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
export interface MetaResponse {
  page?: number;
  limit?: number;
  totalData?: number;
  totalPage?: number;
}


export interface ErrorResponse {
  code: string;
  details?: string | string[];
}
