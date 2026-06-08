export type ClientResult<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export function ok<T>(value: T): ClientResult<T> {
  return { ok: true, value }
}

export function err<E = string>(error: E): ClientResult<never, E> {
  return { ok: false, error }
}

export function isOk<T, E>(result: ClientResult<T, E>): result is { ok: true; value: T } {
  return result.ok
}
