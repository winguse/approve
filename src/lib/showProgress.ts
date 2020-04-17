import { LoadingBar } from 'quasar'

let guard = 0

export default function showProgress (func: () => any) {
  return async function n (...args: any[]): Promise<any> {
    let callStop = false
    if (guard === 0) {
      guard = Math.random()
      callStop = true
      LoadingBar.start()
    }
    try {
      // @ts-ignore
      const result = await Promise.resolve(func.apply(this, args))
      return result
    } finally {
      if (callStop) {
        LoadingBar.stop()
        guard = 0
      }
    }
  }
}
