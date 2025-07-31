import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode, isPreview, command, isSsrBuild }) => {
  // 构建配置
  if (isSsrBuild) {
    // 服务端构建
    return {
      plugins: [vue()],
      build: {
        outDir: 'dist/server',
        ssr: true,
        rollupOptions: {
          input: 'client/main.server.js',
          output: {
            format: 'cjs',
          },
          external: ['koa', '@koa/router']
        },
      },
    }
  } else {
    // 客户端构建
    return {
      plugins: [vue()],
      // 允许crossOriginIsolated
      server: {
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
        },
      },
      build: {
        outDir: 'dist/client',
        rollupOptions: {
          input: 'client/main.js',
        },
      },
    }
  }
})