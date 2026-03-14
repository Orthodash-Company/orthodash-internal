type SuccessResult<T> = readonly [T, null]
type ErrorResult<E> = readonly [null, E]
export type Result<T, E = Error> = SuccessResult<T> | ErrorResult<E>

export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    return [await promise, null]
  } catch (error) {
    return [null, error as E]
  }
}
