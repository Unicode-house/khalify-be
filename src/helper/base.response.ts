import { BaseResponse, MetaResponse } from "src/interface/baseResponse.interface";

export class ResponseHelper {
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: MetaResponse,
  ): BaseResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message: string,
    statusCode: number,
    code: string,
    details?: string | string[],
  ): BaseResponse<null> {
    return {
      success: false,
      statusCode,
      message,
      data: null,
      error: {
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
