import { IS_SSR } from '../utils/env'

// utils/api.js
let fetchImplementation

if (!IS_SSR) {
  // 客户端使用浏览器fetch
  fetchImplementation = window.fetch
} else {
  // 服务端使用node-fetch或axios
  const nodeVersion = process.versions.node
  const isNode18OrAbove = parseInt(nodeVersion.split('.')[0], 10) >= 18
  if (isNode18OrAbove) {
    // Node.js 18+ 使用内置的 fetch
    fetchImplementation = globalThis.fetch
  } else {
    const fetch = require('node-fetch')
    fetchImplementation = fetch
  }
}

export async function fetchData(url, options) {
  return fetchImplementation(`${IS_SSR ? 'http://localhost:3000' : ''}${url}`, options)
}