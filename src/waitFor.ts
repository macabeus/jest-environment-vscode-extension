const timeout = 4_500

const loopWaitFor = async <T>(
  startedAt: number,
  callback: () => T | Promise<T>,
  onResolve: (result: T) => void,
  onTimeout: (error: Error) => void
) => {
  try {
    const result = await callback()

    onResolve(result)
  } catch {
    if ((new Date().getTime()) > (startedAt + timeout)) {
      onTimeout(new Error('Timeout on waitFor'))
      return
    }

    setTimeout(() => {
      loopWaitFor(startedAt, callback, onResolve, onTimeout)
    }, 250)
  }
}

const waitFor = <T>(callback: () => T | Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    loopWaitFor((new Date()).getTime(), callback, resolve, reject)
  })
}

export default waitFor
