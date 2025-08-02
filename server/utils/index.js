const fs = require('fs')
const crypto = require('crypto')

const isFileOrDirExit = async (path, mode = fs.constants.F_OK) => {
  try {
    await fs.promises.access(path, mode)
    return true
  } catch (error) {
    // 路径不存在的错误码
    if (error.code === 'ENOENT') return false
    throw error
  }
}

const createDir = async (path) => {
  try {
    await fs.promises.mkdir(path)
    return true
  } catch (error) {
    if (error.code === 'EEXIST') return true
    throw error
  }
}

const getFilesStatFromDir = async (dirPath, deep = false) => {
  try {
    const files = await fs.promises.readdir(dirPath)
    if (!deep) return files
    const results = await Promise.all(files.map(async (file) => {
      const fullPath = path.join(dirPath, file)
      const stat = await fs.promises.stat(fullPath)
      if (stat.isDirectory()) {
        return getFilesStatFromDir(fullPath, deep)
      } else if (stat.isFile) {
        return fullPath
      }
    }))
    return results.flat()
  } catch (error) {
    console.log('getFilesStatFromDir', error);
    throw error
  }
}

const checkFileSHA256 = async (path, checkHash) => {
  const hash = crypto.createHash('sha256')
  const stream = fs.createReadStream(path)
  return new Promise((resolve, reject) => {
    stream.on('error', reject)
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex') === checkHash))
  })
}

const removeFile = async (path) => {
  try {
    await fs.promises.unlink(path)
    return true
  } catch (error) {
    console.log(`removeFile ${path} error: `, error)
    return false
  }
}

const removeEmptyDir = async (path) => {
  try {
    await fs.promises.rmdir(path)
    return true
  } catch (error) {
    console.log(`removeEmptyDir ${path} error: `, error)
    return false
  }
}

module.exports = {
  isFileOrDirExit,
  createDir,
  getFilesStatFromDir,
  checkFileSHA256,
  removeFile,
  removeEmptyDir
}