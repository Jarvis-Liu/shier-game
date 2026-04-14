import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import type { Room, Player } from '~/../shared/types'

export const useRoomStore = defineStore('room', () => {
  // 当前房间全量状态
  const room = ref<Room | null>(null)

  // 当前在线的玩家个人信息 (从 localStorage 恢复)
  const user = ref<{ userId: string, nickname: string } | null>(null)

  // 计算属性
  const isHost = computed(() => room.value?.players.find(p => p.userId === user.value?.userId)?.role === 'host')
  const myRole = computed(() => {
    if (!room.value || !user.value) return 'spectator'
    const player = room.value.players.find(p => p.userId === user.value!.userId)
    if (player) return player.role
    return 'spectator'
  })

  const isMyTurn = computed(() => room.value?.currentTurnUserId === user.value?.userId)

  // 更新房间状态
  function updateRoom(newRoom: Room) {
    room.value = newRoom
  }

  // 初始化用户信息
  function initUser(nickname: string) {
    // 只有在没有 ID 的时候才生成新 ID (实现断线重连的关键)
    let userId = localStorage.getItem('numdecode_user_id')
    if (!userId) {
      userId = uuidv4()
      localStorage.setItem('numdecode_user_id', userId)
    }

    user.value = { userId, nickname }
    localStorage.setItem('numdecode_nickname', nickname)
  }

  // 状态清理
  function reset() {
    room.value = null
  }

  return {
    room,
    user,
    isHost,
    myRole,
    isMyTurn,
    updateRoom,
    initUser,
    reset
  }
})
