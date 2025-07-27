export const IS_SSR = import.meta.env.SSR || typeof window === 'undefined' || false;

// SSR 的全局数据状态
export const __INITIAL_STATE__ = {}