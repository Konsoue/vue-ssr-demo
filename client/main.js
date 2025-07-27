import { createApp } from 'vue'
import App from './App.vue'
import { IS_SSR } from './utils/env';
import { SSRState } from './utils/SSRState';

const app = createApp(App)

if (!IS_SSR && window.__INITIAL_STATE__) {
  const state = window.__INITIAL_STATE__;
  Object.entries(state).forEach(([key, value]) => {
    SSRState.set(key, value);
  });
  document.getElementById('SSR_STATE')?.remove(); // 移除 SSR 状态脚本标签
}

// 挂载到DOM
app.mount('#app')