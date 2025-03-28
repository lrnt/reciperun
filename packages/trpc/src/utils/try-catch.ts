export interface Success<T> {
  data: T;
  error: null;
}

export interface Failure<E> {
  data: null;
  error: E;
}

export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Create a successful Result
 */
export function success<T>(data: T): Success<T> {
  return { data, error: null };
}

/**
 * Create a failure Result
 */
export function failure<E>(error: E): Failure<E> {
  return { data: null, error };
}

/**
 * Wraps a promise in a try/catch and returns a Result
 */
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}
