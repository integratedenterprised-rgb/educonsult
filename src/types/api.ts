/**
 * Standardized API response envelope. Every JSON route returns this shape so
 * the client never has to branch on ad-hoc error structures.
 */

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
