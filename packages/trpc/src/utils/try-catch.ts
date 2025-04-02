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
export function tryCatch<T, E = Error>(fn: () => T): Result<T, E>;
export function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>>;
export function tryCatch<T, E = Error>(
  fn: () => Promise<T>,
): Promise<Result<T, E>>;
export function tryCatch<T, E = Error>(
  promiseOrFunction: Promise<T> | (() => T | Promise<T>),
): Promise<Result<T, E>> | Result<T, E> {
  // Handle function case
  if (typeof promiseOrFunction === "function") {
    try {
      const result = promiseOrFunction();

      // If function returns a promise, handle it asynchronously
      if (result instanceof Promise) {
        return result
          .then((data) => ({ data, error: null }))
          .catch((error) => ({ data: null, error: error as E }));
      }

      // If function returns a value, return synchronously
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: error as E };
    }
  }

  // Handle direct promise case
  return promiseOrFunction
    .then((data) => ({ data, error: null }))
    .catch((error) => ({ data: null, error: error as E }));
}
