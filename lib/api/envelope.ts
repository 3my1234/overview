export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function ok<T>(data: T, message?: string): ApiEnvelope<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function fail(error: string, message?: string): ApiEnvelope<never> {
  return {
    success: false,
    error,
    message,
  };
}
