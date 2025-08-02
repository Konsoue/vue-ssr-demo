<template>
  <input
    type="file"
    id="file"
    name="file"
    :multiple="fileOptions.multiple"
    :accept="fileOptions.accept"
    :capture="fileOptions.capture"
    @change="fileChange"
    @input="fileInput"
  />
</template>
<script setup>
import { reactive } from "vue"
import { File_SHA256SUM, transformSharedArrayBuffer } from "./utils"
import { FILE_STATUS } from "./utils/constant"
const fileOptions = reactive({
  multiple: false,
  accept: "image/*,video/*,audio/*",
  // capture: true,
})

const filesList = reactive({
  value: [],
})

const chunkEventHanlder = (
  offset,
  fileSize,
  chunkSize,
  chunkReader,
  percentCallback
) => {
  return new Promise((resolve, reject) => {
    chunkReader.onloadstart = () => {}
    chunkReader.onprogress = (e) => {
      const percent = Math.floor(
        (((e.loaded / e.total) * chunkSize + offset) / fileSize) * 100
      )
      percentCallback(percent)
    }
    chunkReader.onload = async (e) => {
      const result = e.target.result
      const chunkHash = await File_SHA256SUM(result)
      resolve({
        chunkHash,
        buffer: transformSharedArrayBuffer(result),
      })
    }
    chunkReader.onerror = (e) => {
      console.error("Error reading chunk:", e)
      reject(e)
    }
    chunkReader.onabort = () => {
      console.warn("Chunk reading aborted")
      reject(new Error("Chunk reading aborted"))
    }
  })
}

/**
 * 本地文件读取
 * @param param0
 */
const chunkReadFile = async ({
  file,
  chunkSize = 1024 * 1024,
  percentCallback = (percent) => {},
}) => {
  let offset = 0
  const chunks = [] // 存储所有分块
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize)
    let chunkReader = new FileReader()
    chunkReader.readAsArrayBuffer(chunk)
    const { chunkHash, buffer: chunkArrayBuffer } = await chunkEventHanlder(
      offset,
      file.size,
      chunkSize,
      chunkReader,
      percentCallback
    )
    chunks.push({
      index: Math.floor(offset / chunkSize), //分片序号
      buffer: chunkArrayBuffer,
      chunkHash,
    })
    offset += chunkSize
  }
  return chunks
}

// 找断点
const findNextIndex = (indexList = [], cur) => {
  // 判断后端分片数据是连续的，不连续选出断点
  for (let i = 1, len = indexList.length; i < len; i++) {
    if (indexList[i - 1] + 1 === indexList[i]) continue
    return indexList[i - 1] + 1
  }
  // 前后端分片一致，以前端为准
  if (indexList[indexList.length - 1] === cur) return cur + 1
  // 不一致，以后端为准
  else return indexList[indexList.length - 1] + 1
}

/**
 * 文件上传：断点续传
 * @param chunks
 * @param fileHash
 */
const uploadFile = async ({
  chunks,
  fileHash,
  processCallback = () => {},
  fileExt,
}) => {
  if (!fileHash || chunks.length === 0) return
  let finish = false
  let maxUploadRetry = 100
  for (let i = 0, len = chunks.length; i < len; ) {
    console.log("for i=", i)
    const chunk = chunks[i]
    const formData = new FormData()
    formData.append("fileChunk", new Blob([chunk.buffer]))
    formData.append("index", chunk.index)
    formData.append("fileChunkHash", chunk.chunkHash)
    formData.append("fileHash", fileHash)
    const res = await fetch("/api/uploadFileChunk", {
      method: "POST",
      body: formData,
    })
    // 后端返回断点续传进度
    const data = await res.json()
    console.log("fetch", data)
    // 如果已存在该文件，直接结束。所谓的：秒传
    if (data.status === FILE_STATUS.FINISH) break
    // 实现断点续传
    if (data.status === FILE_STATUS.NO_FINISH) {
      // 上传重试，最大重试次数避免死循环
      if (!data.ok && maxUploadRetry) {
        maxUploadRetry--
        continue
      }
      const indexList = data.indexList.map((i) => Number(i)).sort()
      if (indexList.length === len) {
        finish = true
        break
      } else {
        i = findNextIndex(indexList, i)
      }
    }
    processCallback(Math.floor(i / len) * 100)
  }
  if (finish) {
    // 上传完成后，通知后端合并文件
    const res = await fetch("/api/mergeFile", {
      method: "POST",
      body: JSON.stringify({ fileHash, fileExt }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    console.log(res)
  }
}

/**
 * 使用 web worker 计算文件哈希值
 * 使用 sharedArrayBuffer 传递数据，实现内存数据共享
 * @param chunks
 */
const fileHashCompute = async (chunks) => {
  const worker = new Worker(
    new URL("./workers/largeFileHashSumWorker.js", import.meta.url),
    {
      type: "module",
    }
  )
  chunks.forEach((chunk) => {
    worker.postMessage(chunk.buffer)
  })
  worker.postMessage("merge")
  return new Promise((resolve) => {
    worker.onmessage = function (e) {
      console.log("Message from worker:", e.data)
      resolve(e.data)
    }
  })
}

const fileChange = async (event) => {
  const files = event.target.files
  if (files.length > 0) {
    console.log("Selected files:", files)
    // Handle file upload logic here
    filesList.value = Array.from(files)
    const file = filesList.value[0]
    const chunks = await chunkReadFile({
      file,
      // percentCallback: (percent) => console.log(percent),
    })
    const [_, fileExt] = file.name.split(".")
    const fileHash = await fileHashCompute(chunks)
    await uploadFile({
      chunks,
      fileHash,
      fileExt,
    })
  } else {
    console.log("No files selected")
  }
}
</script>
