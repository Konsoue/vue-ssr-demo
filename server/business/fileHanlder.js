const path = require('path')
const fs = require('fs')
const { isFileOrDirExit, createDir, getFilesStatFromDir, checkFileSHA256 } = require('../utils')


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
      const writeStream = fs.createWriteStream(zipFilePath)
      const fileList = await getFilesStatFromDir(chunkFileDirPath)
      for (let chunkFileName of fileList) {
        const chunkPath = path.join(chunkFileDirPath, chunkFileName)
        const readStream = fs.createReadStream(chunkPath)
        await new Promise((resolve, reject) => {
          readStream.pipe(writeStream, { end: false })
          readStream.on('end', resolve)
          readStream.on('error', reject)
        })
      }
      writeStream.end()
    }
  }
}

module.exports = {
  addFile2Nas,
  mergeChunkFile
}