import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(message: string, code = 'BAD_REQUEST', status = 400, details?: ApiErrorDetail[]) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
    },
    { status }
  );
}
