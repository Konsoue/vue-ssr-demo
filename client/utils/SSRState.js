import { __INITIAL_STATE__ } from "./env"

export const SSRState = {
  set(key, value) {
    __INITIAL_STATE__[key] = value
  },
  get(key) {
    return __INITIAL_STATE__[key]
  },
  has(key) {
    return key in __INITIAL_STATE__
  },
  clear() {
    for (const key in __INITIAL_STATE__) {
      if (__INITIAL_STATE__.hasOwnProperty(key)) {
        delete __INITIAL_STATE__[key]
      }
    }
  },
}