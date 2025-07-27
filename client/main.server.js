import { createSSRApp } from 'vue'
import App from './App.vue'
import { __INITIAL_STATE__ } from './utils/env'

export function createApp() {
  const app = createSSRApp(App)
  // 提供服务端初始状态
  app.provide('__INITIAL_STATE__', __INITIAL_STATE__)
  // 配置路由、状态管理等
  return { app }
}