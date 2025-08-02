const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { isFileOrDirExit, createDir, getFilesStatFromDir, checkFileSHA256, removeFile, removeEmptyDir } = require('../utils')


const FILE_STATUS = {
  NO_FINISH: 'NO_FINISH',
  FINISH: 'FINISH'
}
const zipDirPath = path.join(process.cwd(), 'server', 'nas', 'zip')
const tmpDirPath = path.join(process.cwd(), 'server', 'nas', 'tmp')

/**
 * 把文件存储到本地/远程 NAS
 * @param {*} param0
 * @returns
 */
const addFile2Nas = async ({ fileChunk, index, fileHash, fileChunkHash, fileExt = 'zip' }) => {
  const zipFilePath = path.join(zipDirPath, `${fileHash}.${fileExt}`)
  const chunkFileDirPath = path.join(tmpDirPath, fileHash)
  if (await isFileOrDirExit(zipFilePath)) {
    return { status: FILE_STATUS.FINISH, indexList: [] }
  } else {
    if (!(await isFileOrDirExit(chunkFileDirPath))) {
      await createDir(chunkFileDirPath)
    }
    const fileList = await getFilesStatFromDir(chunkFileDirPath)
    // 通知前端断点位置
    if (fileList.includes(index)) {
      return { status: FILE_STATUS.NO_FINISH, indexList: fileList, ok: true }
    } else {
      const chunkFilePath = path.join(chunkFileDirPath, index)
      await fs.promises.writeFile(chunkFilePath, fileChunk.buffer)
      if (await checkFileSHA256(chunkFilePath, fileChunkHash)) {
        return { status: FILE_STATUS.NO_FINISH, indexList: [...fileList, index], ok: true }
      } else {
        return { status: FILE_STATUS.NO_FINISH, indexList: [...fileList], ok: false }
      }
    }
  }
}


const mergeChunkFile = async (fileHash, fileExt) => {
  const zipFilePath = path.join(zipDirPath, `${fileHash}.${fileExt}`)
  const chunkFileDirPath = path.join(tmpDirPath, fileHash)
  if (await isFileOrDirExit(zipFilePath)) {
    return { status: FILE_STATUS.FINISH, ok: true }
  } else {
    if (!await isFileOrDirExit(chunkFileDirPath)) {
      throw new Error('没上传过相关文件')
    } else {
      return new Promise(async (resolve, reject) => {
        const writeStream = fs.createWriteStream(zipFilePath)
        let fileList = await getFilesStatFromDir(chunkFileDirPath)
        fileList = fileList.map(n => Number(n)).sort((a, b) => a - b)
        const hash = crypto.createHash('sha256')
        writeStream.on('finish', async () => {
          const finishHash = hash.digest('hex')
          if (finishHash === fileHash) {
            resolve({
              status: FILE_STATUS.FINISH,
              ok: true
            })
            for (let chunkFileName of fileList) {
              await removeFile(path.join(chunkFileDirPath, String(chunkFileName)))
            }
            await removeEmptyDir(chunkFileDirPath)
          } else {
            await removeFile(zipFilePath)
            resolve({
              status: FILE_STATUS.NO_FINISH,
              ok: false
            })
          }
        })
        writeStream.on('error', (err) => {
          reject({
            status: FILE_STATUS.NO_FINISH,
            ok: false
          })
        })
        for (let chunkFileName of fileList) {
          const chunkPath = path.join(chunkFileDirPath, String(chunkFileName))
          const readStream = fs.createReadStream(chunkPath)
          await new Promise((resolve, reject) => {
            readStream.on('data', (chunk) => {
              writeStream.write(chunk)
              hash.update(chunk)
            })
            readStream.on('end', resolve)
            readStream.on('error', reject)
          })
        }
        writeStream.end()
      })
    }
  }
}

module.exports = {
  addFile2Nas,
  mergeChunkFile
}