import { Server } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
import { setupWSHandlers } from '../utils/wsHandlers'

export default defineNitroPlugin((nitroApp) => {

  if (process.env.prerender) {
    return
  }

  // Vercel Serverless 环境不支持原生 WebSocket 服务，避免其在此环境启动导致问题
  if (process.env.VERCEL) {
    console.warn('[Nuxt] Skipping Socket.io initialization: Vercel does not support WebSocket servers.')
    return
  }
  // 利用全局变量防止 HMR 时重复挂载
  if ((global as any)._io) {
    console.log('[Nuxt] Socket.io already initialized.')
    return
  }

  let io: Server

  nitroApp.hooks.hook('request', (event) => {
    const req = event.node.req
    // 获取底层 Node http.Server 实例
    const server = (req.socket as any)?.server as HttpServer

    if (server && !io) {
      console.log('⚡ [Socket.io] Initializing Server on first request...')
      io = new Server(server, {
        cors: {
          origin: '*'
        }
      })

      // 暴露到全局，避免重复实例化
      ;(global as any)._io = io

      setupWSHandlers(io)
    }
  })

  console.log('🔌 [Nuxt] Socket.io Plugin Registration Hooked')
})
