import { NextRequest, NextResponse } from 'next/server';
import { AuthError } from './auth';

type RouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> },
) => Promise<NextResponse>;

export function apiHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode },
        );
      }
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode },
        );
      }
      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export function getSearchParams(request: NextRequest) {
  const url = new URL(request.url);
  return {
    get: (key: string) => url.searchParams.get(key),
    getNumber: (key: string, defaultVal: number) => {
      const val = url.searchParams.get(key);
      return val ? parseInt(val, 10) : defaultVal;
    },
  };
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
