const koa = require('koa')
const router = require('./router')
const path = require('path')
const serve = require('koa-static')

const PORT = 3000
const app = new koa()

app
  .use(router.routes())
  .use(router.allowedMethods())
  .use(serve(path.join(process.cwd(), 'dist/client')))

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})