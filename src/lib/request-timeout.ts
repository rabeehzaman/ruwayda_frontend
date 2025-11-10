/**
 * Request timeout wrapper for Supabase queries
 * Prevents requests from hanging indefinitely
 */

export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`)
    this.name = 'RequestTimeoutError'
  }
}

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 30000ms = 30s)
 * @returns Promise that rejects if timeout is reached
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new RequestTimeoutError(timeoutMs)), timeoutMs)
    ),
  ])
}

/**
 * Wraps a Supabase query with timeout and error handling
 * @param queryFn - Function that returns a Supabase query promise
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise with timeout protection
 */
export async function supabaseWithTimeout<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  timeoutMs: number = 30000
): Promise<{ data: T | null; error: any }> {
  try {
    return await withTimeout(queryFn(), timeoutMs)
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      return {
        data: null,
        error: {
          message: 'Request timed out. Please check your connection and try again.',
          code: 'REQUEST_TIMEOUT',
          details: error.message,
        },
      }
    }
    throw error
  }
}
