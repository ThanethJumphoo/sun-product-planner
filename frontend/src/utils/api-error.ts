import { AxiosError } from 'axios';
import { ApiError } from '../types/api';

export class AppError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number = 500, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    const statusCode = error.response?.status || 500;
    const message = data?.message || error.message || 'An unexpected server error occurred';
    const validationErrors = data?.errors;

    return new AppError(message, statusCode, validationErrors);
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('An unknown error occurred');
}
