const Router = require('@koa/router')
const path = require('path')
const { createApp } = require('../dist/server/main.server.js')
const { renderToString } = require('@vue/server-renderer')

const getClientJSIndex = () => {
  const dirPath = path.join(process.cwd(), 'dist', 'client', 'assets')
  const files = require('fs').readdirSync(dirPath)
  // 获取 main.js 的 path，根据实际情况修改
  let fileName = ''
  for (let i = 0; i < files.length; i++) {
    const ext = path.extname(files[i])
    if (ext == '.js') {
      if (path.basename(files[i]).startsWith('main')) {
        fileName = files[i]
        break
      }
    }
  }
  return fileName ? `/assets/${fileName}` : '/assets/index.js'; // 默认返回 index.js
}

const router = new Router()

router.get('/api/:id', async (ctx) => {
  // 模拟用户数据
  ctx.body = { name: 'John Doe', age: 30 }
})

router.get('/', async (ctx) => {
  const { app } = createApp()
  const html = await renderToString(app)
  const clientJSIndex = getClientJSIndex()
  // 获取服务端状态
  const state = JSON.stringify(app._context.provides?.__INITIAL_STATE__ || {});
  ctx.type = 'text/html'
  ctx.body = `<html>
              <head>
                <title>Vue SSR App</title>
              </head>
              <body>
                <div id="app">${html}</div>
              </body>
              <script id="SSR_STATE">window.__INITIAL_STATE__ = ${state}</script>
              <script src="${clientJSIndex}"></script>
            </html>`

})



module.exports = router