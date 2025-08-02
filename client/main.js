import { createApp } from 'vue'
import App from './App.vue'
import { initEnvState } from './utils/env';

const app = createApp(App)

initEnvState()

// 挂载到DOM
app.mount('#app')