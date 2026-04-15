import { Server } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
import { setupWSHandlers } from '../utils/wsHandlers'
import { startRoomGC } from '../utils/roomManager'

declare global {
  var _io: Server | undefined
}

export default defineNitroPlugin((nitroApp) => {
  // 预渲染阶段不启动任何运行时服务
  if (import.meta.prerender) {
    return
  }

  // 启动房间垃圾回收（运行时启动，构建时不执行）
  startRoomGC()

  // Vercel Serverless 环境不支持原生 WebSocket 服务，只跳过 socket.io
  if (process.env.VERCEL) {
    console.warn('[Nuxt] Skipping Socket.io initialization: Vercel does not support WebSocket servers.')
    return
  }
  // 利用全局变量防止 HMR 时重复挂载
  if (globalThis._io) {
    console.log('[Nuxt] Socket.io already initialized.')
    return
  }

  let io: Server

  nitroApp.hooks.hook('request', (event) => {
    // 获取底层 Node http.Server 实例，使用更安全的类型转换
    const server = (event.node.req.socket as { server?: HttpServer })?.server

    if (server && !io) {
      console.log('⚡ [Socket.io] Initializing Server on first request...')
      io = new Server(server, {
        cors: {
          origin: '*'
        }
      })

      // 暴露到全局，避免重复实例化
      globalThis._io = io

      setupWSHandlers(io)
    }
  })

  console.log('🔌 [Nuxt] Socket.io Plugin Registration Hooked')
})
