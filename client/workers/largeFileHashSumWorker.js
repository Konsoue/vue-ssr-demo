import { File_SHA256SUM } from "../utils";

const chunks = []
const mergeFileChunks = async (chunks) => {
  const totalSize = chunks.reduce(
    (sum, chunk) => sum + chunk.byteLength,
    0
  );
  const mergedBuffer = new Uint8Array(totalSize);
  let offset = 0;
  chunks.forEach((chunk) => {
    // 将 arraybuffer 转为 Uint8Array 视图，再进行合并
    mergedBuffer.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  });
  return mergedBuffer;
};



self.onmessage = async function (event) {
  if (event.data === 'merge') { 
    const fileChunks = await mergeFileChunks(chunks)
    const fileHash = await File_SHA256SUM(fileChunks.buffer);
    self.postMessage(fileHash);
  }else {
    chunks.push(event.data)
  }
}