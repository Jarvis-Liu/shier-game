import { io, type Socket } from 'socket.io-client'
import { useRoomStore } from '~/stores/room'

// 将长连接提升至模块级作用域，保证它是跨组件的单例
const globalSocket = ref<Socket | null>(null)

export const useSocketio = () => {
  const socket = globalSocket
  const roomStore = useRoomStore()
  const { add: addToast } = useToast()

  const connect = (roomId: string) => {
    if (socket.value) return

    // 获取本地持久化身份信息
    const { user } = roomStore
    if (!user) return

    // 建立连接
    const socketInstance = io({
      query: { roomId }
    })

    // 加入房间事件
    socketInstance.emit('join_room', {
      roomId,
      userId: user.userId,
      nickname: user.nickname
    })

    // 监听状态更新
    socketInstance.on('room_state_update', (data) => {
      roomStore.updateRoom(data)
    })

    // 监听竞猜结果 (用于动画与音效触发)
    socketInstance.on('guess_result', (record) => {
      // TODO: 触发局部动画
    })

    // 监听游戏结束
    socketInstance.on('game_over', ({ winnerUserId, secrets }) => {
      // 这里的 secrets 揭晓会同步到 store
      if (roomStore.room) {
        (roomStore.room as any).finalSecrets = secrets
      }

      addToast({
        title: winnerUserId === roomStore.user?.userId ? '🎉 破译成功！' : '💀 破译失败...',
        description: winnerUserId === roomStore.user?.userId ? '你率先猜中了对方的号码！' : '对方赢了，下次再努力吧。',
        color: winnerUserId === roomStore.user?.userId ? 'success' : 'error'
      })
    })

    // 错误处理
    socketInstance.on('error', (msg: string) => {
      addToast({
        title: '错误',
        description: msg,
        color: 'error'
      })
    })

    socket.value = socketInstance
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  // 移除 onUnmounted 自动断开逻辑以防止子组件在视图流转 (v-if) 时被销毁从而错误断开全局连接。
  // 必须由宿主页面 [id].vue 显式管理断开。

  // 暴露操作接口
  const setSecret = (roomId: string, secret: string) => {
    socket.value?.emit('set_secret', { roomId, userId: roomStore.user?.userId, secret })
  }

  const submitGuess = (roomId: string, guess: string) => {
    socket.value?.emit('submit_guess', { roomId, userId: roomStore.user?.userId, guess })
  }

  const restartGame = (roomId: string) => {
    socket.value?.emit('restart_game', { roomId, userId: roomStore.user?.userId })
  }

  const updateConfig = (roomId: string, config: any) => {
    socket.value?.emit('update_config', { roomId, userId: roomStore.user?.userId, config })
  }

  return {
    socket,
    connect,
    disconnect,
    setSecret,
    submitGuess,
    restartGame,
    updateConfig
  }
}
