const Router = require('@koa/router')
const multer = require('@koa/multer')
const { validateRequest } = require('../middleware/validateRequest')
const Joi = require('joi')
const { addFile2Nas, mergeChunkFile } = require('../business/fileHanlder')

const upload = multer()

const router = new Router({
  prefix: '/api'
})

// 鉴权
const auth = async (ctx, next) => { await next() }
router.use(auth)

router.get('/user', async (ctx) => {
  // 模拟用户数据
  ctx.body = { name: 'John Doe', age: 30 }
})

router.post('/mergeFile',
  validateRequest(
    Joi.object({
      fileHash: Joi.string().required(),
      fileExt: Joi.string().required()
    })
  ),
  async (ctx) => {
    const { fileHash, fileExt } = ctx.request.body
    // 前期已经做过分片 hash 校验，无需重复
    ctx.body = await mergeChunkFile(fileHash, fileExt)
  }
)

router.post('/uploadFileChunk',
  upload.single('fileChunk'),
  validateRequest(
    Joi.object({
      index: Joi.number().required(),
      fileHash: Joi.string().required(),
      fileChunkHash: Joi.string().required()
    })
  ),
  async (ctx) => {
    const { file, body } = ctx.request
    ctx.body = await addFile2Nas({
      fileChunk: file,
      index: body.index,
      fileHash: body.fileHash,
      fileChunkHash: body.fileChunkHash
    })
  }
)


module.exports = router