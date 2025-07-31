export const voidFn = () => { };


export const File_SHA256SUM = async (fileBuffer) => {
  const hash = await crypto.subtle.digest('SHA-256', fileBuffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 将 ArrayBuffer 转换为 SharedArrayBuffer，为 worker 共享内存做准备
 * @param {*} arrayBuffer 
 * @returns 
 */
export const transformSharedArrayBuffer = (arrayBuffer) => {
  // 1. 检测环境是否支持跨域隔离
  if (typeof SharedArrayBuffer === 'undefined' || !window.crossOriginIsolated) {
    console.log("请配置 COOP/COEP 响应头启用跨域隔离。当前环境不支持 SharedArrayBuffer！");
    return arrayBuffer
  }
  const buffer = new SharedArrayBuffer(arrayBuffer.byteLength);
  const view = new Uint8Array(buffer);
  view.set(new Uint8Array(arrayBuffer));
  return buffer;
}