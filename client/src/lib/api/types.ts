import { type AxiosError } from 'axios';

export type ApiError = {
  message: string;
  status: number;
};

export type ApiResponse<T> = {
  data: T;
  error: ApiError | null;
};

// Common query params that many endpoints might use
export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type DateRangeParams = {
  from_date?: string;
  to_date?: string;
};

// Helper type for converting Axios errors to our ApiError type
export function formatApiError(error: AxiosError): ApiError {
  return {
    message: error.response?.data?.message || error.message || 'An unexpected error occurred',
    status: error.response?.status || 500,
  };
} 