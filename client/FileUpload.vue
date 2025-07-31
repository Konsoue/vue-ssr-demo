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
import { reactive } from "vue";
import { File_SHA256SUM, transformSharedArrayBuffer } from "./utils";

const fileOptions = reactive({
  multiple: false,
  accept: "image/*,video/*,audio/*",
  // capture: true,
});

const filesList = reactive({
  value: [],
});

const chunkEventHanlder = (
  offset,
  fileSize,
  chunkSize,
  chunkReader,
  percentCallback
) => {
  return new Promise((resolve, reject) => {
    chunkReader.onloadstart = () => {};
    chunkReader.onprogress = (e) => {
      const percent = Math.floor(
        (((e.loaded / e.total) * chunkSize + offset) / fileSize) * 100
      );
      percentCallback(percent);
    };
    chunkReader.onload = (e) => {
      const result = e.target.result;
      resolve(transformSharedArrayBuffer(result));
    };
    chunkReader.onerror = (e) => {
      console.error("Error reading chunk:", e);
      reject(e);
    };
    chunkReader.onabort = () => {
      console.warn("Chunk reading aborted");
      reject(new Error("Chunk reading aborted"));
    };
  });
};

/**
 * 本地文件读取
 * @param param0
 */
const chunkReadFile = async ({
  file,
  chunkSize = 1024 * 1024,
  percentCallback = (percent) => {},
}) => {
  let offset = 0;
  const chunks = []; // 存储所有分块
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    let chunkReader = new FileReader();
    chunkReader.readAsArrayBuffer(chunk);
    const chunkArrayBuffer = await chunkEventHanlder(
      offset,
      file.size,
      chunkSize,
      chunkReader,
      percentCallback
    );
    chunks.push({
      index: Math.floor(offset / chunkSize), //分片序号
      buffer: chunkArrayBuffer,
    });
    offset += chunkSize;
  }
  return chunks;
};

/**
 * 文件上传：断点续传
 * @param chunks
 * @param fileHash
 */
const uploadFile = async (chunks, fileHash) => {
  if (!fileHash || chunks.length === 0) return;
  for (let i = 0, len = chunks.length; i < len; i++) {
    const chunk = chunks[i];
    const formData = new FormData();
    formData.append("file", new Blob([chunk.buffer]));
    formData.append("index", chunk.index);
    formData.append("fileHash", fileHash);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    // 后端返回断点续传进度
    const data = await res.json();
    console.log("chunk.upload:", data.uptend);
  }
  // 上传完成后，通知后端合并文件
  await fetch("/api/upload/complete", {
    method: "POST",
    body: JSON.stringify({ fileHash }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

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
  );
  chunks.forEach((chunk) => {
    worker.postMessage(chunk.buffer);
  });
  worker.postMessage("merge");
  return new Promise((resolve) => {
    worker.onmessage = function (e) {
      console.log("Message from worker:", e.data);
      resolve(e.data);
    };
  });
};

const fileChange = async (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    console.log("Selected files:", files);
    // Handle file upload logic here
    filesList.value = Array.from(files);
    const chunks = await chunkReadFile({
      file: filesList.value[0],
      // percentCallback: (percent) => console.log(percent),
    });
    const fileHash = await fileHashCompute(chunks);
  } else {
    console.log("No files selected");
  }
};
</script>
