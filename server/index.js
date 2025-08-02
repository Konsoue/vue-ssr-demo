const koa = require('koa')
const mainRouter = require('./router/main')
const apiRouter = require('./router/api')
const path = require('path')
const serve = require('koa-static')
const { bodyParser } = require('@koa/bodyparser')
const PORT = 3000
const app = new koa()


// 全局错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next(); // 执行后续中间件和路由
  } catch (err) {
    // 统一处理错误
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
    ctx.app.emit('error', err, ctx); // 触发错误事件，用于日志记录 [2,7](@ref)
  }
});

app.use(bodyParser())

app
  .use(apiRouter.routes())
  .use(mainRouter.routes())
  .use(apiRouter.allowedMethods())
  .use(mainRouter.allowedMethods())

app
  .use(serve(path.join(process.cwd(), 'dist/client')))

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})

app.on('error', (err, ctx) => {
  console.log('server error: ', err, ctx)
})

process.on('uncaughtException', (err, origin) => {
  console.log('uncaughtException:', err, origin)
})

process.on('unhandledRejection', (reason, promise) => {
  console.log('unhandledRejection:', reason)
})