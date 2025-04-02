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
 * Wraps a function (sync or async) in a try/catch and returns a Result
 * If the function returns a Promise, the Result will be wrapped in a Promise
 */
export function tryCatch<T>(fn: () => T): Result<T, Error>;
export function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, Error>>;
export function tryCatch<T, E = Error>(
  fn: () => T | Promise<T>,
): Result<T, E> | Promise<Result<T, E>> {
  try {
    const result = fn();

    // Check if the result is a Promise
    if (result instanceof Promise) {
      // Handle async function
      return result
        .then((data) => ({ data, error: null }))
        .catch((error) => ({ data: null, error: error as E }));
    }

    // Handle sync function
    return { data: result, error: null };
  } catch (error) {
    // Handle synchronous errors
    return { data: null, error: error as E };
  }
}
