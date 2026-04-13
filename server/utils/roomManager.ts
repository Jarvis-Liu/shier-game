import { RoomStatus, type Room, type Player, type GuessRecord, type ServerRoom } from '../../shared/types'

// 内存中的房间存储
const rooms = new Map<string, ServerRoom>();

/**
 * 创建新房间
 */
export function createRoom(nickname: string, userId: string): ServerRoom {
  const roomId = Math.random().toString().slice(2, 6); // 4位随机数字
  const host: Player = {
    userId,
    nickname,
    role: 'host',
    isReady: false
  };

  const room: ServerRoom = {
    roomId,
    status: RoomStatus.WAITING,
    players: [host],
    spectators: [],
    currentTurnUserId: null,
    winnerUserId: null,
    logs: [],
    secrets: {},
    restartRequests: []
  };

  rooms.set(roomId, room);
  return room;
}

/**
 * 获取房间 (脱敏处理，禁止下发 secret)
 */
export function getMaskedRoom(roomId: string, userId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  // 深拷贝并脱敏
  const maskedRoom: Room = JSON.parse(JSON.stringify(room));
  // 核心防作弊：清除所有 secret 信息
  delete (maskedRoom as any).secrets;
  
  return maskedRoom;
}

/**
 * 获取原始房间模型 (仅限服务端内部使用)
 */
export function getRawRoom(roomId: string) {
  return rooms.get(roomId);
}

/**
 * 比较猜测数字，返回位置和数字完全正确的个数
 */
export function compareGuess(secret: string, guess: string): number {
  let correct = 0;
  for (let i = 0; i < 4; i++) {
    if (secret[i] === guess[i]) {
      correct++;
    }
  }
  return correct;
}

/**
 * 输入验证：必须是 4 位数字
 */
export function validateNumber(input: string): boolean {
  return /^\d{4}$/.test(input);
}

/**
 * 房间垃圾回收 (GC)
 * 清理掉线超过 10 分钟或已结束的房间
 */
export function roomGC() {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    // 逻辑：如果房间为空，或者结束超过一定时间，则移除
    if (room.players.length === 0) {
      rooms.delete(id);
    }
    // 可以添加更多基于时间的过期逻辑
  }
}

// 每 5 分钟执行一次 GC
setInterval(roomGC, 5 * 60 * 1000);
