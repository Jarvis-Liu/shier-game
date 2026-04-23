import type { Server, Socket } from 'socket.io'
import { getRawRoom, getMaskedRoom, compareGuess, validateNumber } from './roomManager'
import { recordWin } from './leaderboard'
import { getNicknameById } from './userManager'
import { RoomStatus, type GuessRecord } from '../../shared/types'

// 记录 socketId 到房间和用户 ID 的映射，便于断开连接时清理
const socketToUser = new Map<string, { roomId: string, userId: string }>()

export function setupWSHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    // 1. 加入房间
    socket.on('join_room', ({ roomId, userId, nickname }: { roomId: string, userId: string, nickname: string }) => {
      const room = getRawRoom(roomId)
      if (!room) {
        socket.emit('error', '房间不存在')
        return
      }

      // 使用服务端注册的昵称，防止客户端伪造
      const verifiedNickname = getNicknameById(userId) || nickname

      socket.join(roomId)

      // 处理身份
      const player = room.players.find(p => p.userId === userId)
      if (player) {
        player.socketId = socket.id
      } else if (room.players.length < 2 && room.status === RoomStatus.WAITING) {
        // 第二个进入的人自动成为 Guest
        room.players.push({
          userId,
          nickname: verifiedNickname,
          role: 'guest',
          isReady: false,
          socketId: socket.id
        })
        // 触发状态流转
        room.status = RoomStatus.SETTING
      } else {
        // 观众: 增加去重检查，如果已在观众席则更新 socketId
        const existingSpectator = room.spectators.find(s => s.userId === userId)
        if (existingSpectator) {
          existingSpectator.socketId = socket.id
        } else {
          room.spectators.push({
            userId,
            nickname: verifiedNickname,
            role: 'spectator',
            isReady: false,
            socketId: socket.id
          })
        }
      }

      // 记录映射
      socketToUser.set(socket.id, { roomId, userId })

      // 全量更新状态 (带脱敏)
      broadcastRoomState(io, roomId)
    })

    // 2. 设定秘密数字
    socket.on('set_secret', ({ roomId, userId, secret }: { roomId: string, userId: string, secret: string }) => {
      const room = getRawRoom(roomId)
      if (!room || room.status !== RoomStatus.SETTING) return

      if (!validateNumber(secret)) {
        socket.emit('error', '无效的数字格式')
        return
      }

      const player = room.players.find(p => p.userId === userId)
      if (!player) return

      const secrets = room.secrets as Record<string, string>
      secrets[userId] = secret
      player.isReady = true

      // 检查是否都准备好了
      if (room.players.length === 2 && room.players.every(p => p.isReady)) {
        room.status = RoomStatus.PLAYING
        // 房主先手
        room.currentTurnUserId = room.players[0]?.userId ?? null
      }

      broadcastRoomState(io, roomId)
    })

    // 3. 提交猜测
    socket.on('submit_guess', ({ roomId, userId, guess }: { roomId: string, userId: string, guess: string }) => {
      const room = getRawRoom(roomId)
      if (!room || room.status !== RoomStatus.PLAYING) return
      if (room.currentTurnUserId !== userId) return

      if (!validateNumber(guess)) {
        socket.emit('error', '无效的数字格式')
        return
      }

      const opponent = room.players.find(p => p.userId !== userId)
      if (!opponent) return

      const secrets = room.secrets as Record<string, string>
      const opponentSecret = secrets[opponent.userId]
      if (!opponentSecret) return

      const correctCount = compareGuess(opponentSecret, guess)

      const record: GuessRecord = {
        userId,
        guessNumber: guess,
        correctCount,
        timestamp: Date.now()
      }

      room.logs.push(record)

      if (correctCount === 4) {
        room.status = RoomStatus.FINISHED
        room.winnerUserId = userId

        // 排行榜记录获胜者
        try {
          recordWin(userId)
        } catch (e) {
          console.error('Failed to record win:', e)
        }

        io.to(roomId).emit('game_over', {
          winnerUserId: userId,
          secrets: room.secrets
        })
      } else {
        // 切换回合
        room.currentTurnUserId = opponent.userId
      }

      // 广播猜测结果
      io.to(roomId).emit('guess_result', record)
      broadcastRoomState(io, roomId)
    })

    // 4. 再来一局
    socket.on('restart_game', ({ roomId, userId }: { roomId: string, userId: string }) => {
      const room = getRawRoom(roomId)
      if (!room || room.status !== RoomStatus.FINISHED) return

      if (!room.restartRequests.includes(userId)) {
        room.restartRequests.push(userId)
      }

      if (room.restartRequests.length >= 2) {
        // 重置房间
        room.status = RoomStatus.SETTING
        room.logs = []
        room.secrets = {}
        room.winnerUserId = null
        room.currentTurnUserId = null
        room.restartRequests = []
        room.players.forEach(p => p.isReady = false)
      }

      broadcastRoomState(io, roomId)
    })

    // 5. 更新房间配置
    socket.on('update_config', ({ roomId, userId, config }: { roomId: string, userId: string, config: Partial<RoomConfig> }) => {
      const room = getRawRoom(roomId)
      if (!room) return

      const player = room.players.find(p => p.userId === userId)
      if (!player || player.role !== 'host') {
        socket.emit('error', '只有房主可以更改设置')
        return
      }

      room.config = { ...room.config, ...config }
      broadcastRoomState(io, roomId)
    })

    socket.on('disconnect', () => {
      const info = socketToUser.get(socket.id)
      if (info) {
        const { roomId, userId } = info
        const room = getRawRoom(roomId)

        if (room) {
          // 清理选手状态 (标记离线而非删除，以便重连)
          const player = room.players.find(p => p.userId === userId)
          if (player) {
            player.socketId = undefined
          }

          // 彻底清理观众座位
          const spectatorIndex = room.spectators.findIndex(s => s.userId === userId)
          if (spectatorIndex !== -1) {
            room.spectators.splice(spectatorIndex, 1)
          }

          broadcastRoomState(io, roomId)
        }

        socketToUser.delete(socket.id)
      }
      console.log('Client disconnected and cleaned up:', socket.id)
    })
  })
}

/**
 * 广播脱敏后的房间状态给所有人
 */
function broadcastRoomState(io: Server, roomId: string) {
  const masked = getMaskedRoom(roomId, '')
  if (masked) {
    io.to(roomId).emit('room_state_update', masked)
  }
}
