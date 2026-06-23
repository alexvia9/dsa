/** Reject if `promise` does not settle within `ms` milliseconds. */
export function promiseWithTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Request timed out',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err: unknown) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}
