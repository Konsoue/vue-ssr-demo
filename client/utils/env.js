import { SSRState } from './SSRState';

export const IS_SSR = import.meta.env.SSR || typeof window === 'undefined' || false;

// SSR 的全局数据状态
export const __INITIAL_STATE__ = {}

export const SSR_BASE_URL = 'http://localhost:3000'

export const initEnvState = () => {
  window.addEventListener('load', () => {
    if (!IS_SSR && window.__INITIAL_STATE__) {
      const state = window.__INITIAL_STATE__;
      Object.entries(state).forEach(([key, value]) => {
        SSRState.set(key, value);
      });
      document.getElementById('SSR_STATE')?.remove(); // 移除 SSR 状态脚本标签
    }
  })
}