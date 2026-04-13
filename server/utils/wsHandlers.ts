import type { Server, Socket } from 'socket.io'
import { getRawRoom, getMaskedRoom, compareGuess, validateNumber } from './roomManager'
import { RoomStatus, type GuessRecord } from '../../shared/types'

export function setupWSHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // 1. 加入房间
    socket.on('join_room', ({ roomId, userId, nickname }) => {
      const room = getRawRoom(roomId);
      if (!room) {
        socket.emit('error', '房间不存在');
        return;
      }

      socket.join(roomId);

      // 处理身份
      const player = room.players.find(p => p.userId === userId);
      if (player) {
        player.socketId = socket.id;
      } else if (room.players.length < 2 && room.status === RoomStatus.WAITING) {
        // 第二个进入的人自动成为 Guest
        room.players.push({
          userId,
          nickname,
          role: 'guest',
          isReady: false,
          socketId: socket.id
        });
        // 触发状态流转
        room.status = RoomStatus.SETTING;
      } else {
        // 观众
        room.spectators.push({
          userId,
          nickname,
          role: 'spectator',
          isReady: false,
          socketId: socket.id
        });
      }

      // 全量更新状态 (带脱敏)
      broadcastRoomState(io, roomId);
    });

    // 2. 设定秘密数字
    socket.on('set_secret', ({ roomId, userId, secret }) => {
      const room = getRawRoom(roomId);
      if (!room || room.status !== RoomStatus.SETTING) return;

      if (!validateNumber(secret)) {
        socket.emit('error', '无效的数字格式');
        return;
      }

      const player = room.players.find(p => p.userId === userId);
      if (!player) return;

      room.secrets[userId] = secret;
      player.isReady = true;

      // 检查是否都准备好了
      if (room.players.length === 2 && room.players.every(p => p.isReady)) {
        room.status = RoomStatus.PLAYING;
        // 房主先手
        room.currentTurnUserId = room.players[0].userId;
      }

      broadcastRoomState(io, roomId);
    });

    // 3. 提交猜测
    socket.on('submit_guess', ({ roomId, userId, guess }) => {
      const room = getRawRoom(roomId);
      if (!room || room.status !== RoomStatus.PLAYING) return;
      if (room.currentTurnUserId !== userId) return;

      if (!validateNumber(guess)) {
        socket.emit('error', '无效的数字格式');
        return;
      }

      const opponent = room.players.find(p => p.userId !== userId);
      if (!opponent) return;

      const opponentSecret = room.secrets[opponent.userId];
      const correctCount = compareGuess(opponentSecret, guess);

      const record: GuessRecord = {
        userId,
        guessNumber: guess,
        correctCount,
        timestamp: Date.now()
      };

      room.logs.push(record);

      if (correctCount === 4) {
        room.status = RoomStatus.FINISHED;
        room.winnerUserId = userId;
        io.to(roomId).emit('game_over', {
          winnerUserId: userId,
          secrets: room.secrets
        });
      } else {
        // 切换回合
        room.currentTurnUserId = opponent.userId;
      }

      // 广播猜测结果 (注意：视角隔离将在 broadcastRoomState 中处理或单独发)
      io.to(roomId).emit('guess_result', record);
      broadcastRoomState(io, roomId);
    });

    // 4. 再来一局
    socket.on('restart_game', ({ roomId, userId }) => {
      const room = getRawRoom(roomId);
      if (!room || room.status !== RoomStatus.FINISHED) return;

      if (!room.restartRequests.includes(userId)) {
        room.restartRequests.push(userId);
      }

      if (room.restartRequests.length >= 2) {
        // 重置房间
        room.status = RoomStatus.SETTING;
        room.logs = [];
        room.secrets = {};
        room.winnerUserId = null;
        room.currentTurnUserId = null;
        room.restartRequests = [];
        room.players.forEach(p => p.isReady = false);
      }

      broadcastRoomState(io, roomId);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // TODO: 实现心跳判定与掉线重连逻辑
    });
  });
}

/**
 * 广播脱敏后的房间状态给所有人
 */
function broadcastRoomState(io: Server, roomId: string) {
  const masked = getMaskedRoom(roomId, ''); 
  if (masked) {
    io.to(roomId).emit('room_state_update', masked);
  }
}
