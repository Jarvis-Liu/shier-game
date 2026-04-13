/**
 * 房间状态枚举
 */
export enum RoomStatus {
  WAITING = 'WAITING',   // 等待中
  SETTING = 'SETTING',   // 准备阶段 (设置秘密数字)
  PLAYING = 'PLAYING',   // 对战阶段
  FINISHED = 'FINISHED'  // 对局结束
}

/**
 * 玩家角色
 */
export type PlayerRole = 'host' | 'guest' | 'spectator';

/**
 * 玩家实体
 */
export interface Player {
  userId: string;        // 唯一ID (UUID)
  nickname: string;      // 玩家昵称
  role: PlayerRole;      // 角色
  isReady: boolean;      // 此阶段是否已设定完秘密数字
  socketId?: string;     // Socket 连接 ID
}

/**
 * 猜测行动记录
 */
export interface GuessRecord {
  userId: string;        // 猜测者的ID
  guessNumber: string;   // 猜的数字 "1234"
  correctCount: number;  // 猜对的个数 (0-4)
  timestamp: number;     // 猜测时间戳
}

/**
 * 房间实体
 */
export interface Room {
  roomId: string;             // 4位随机房间码
  status: RoomStatus;         // 当前状态
  players: Player[];          // 参与者 (Host/Guest)
  spectators: Player[];       // 观众列表
  currentTurnUserId: string | null;  // 当前轮到谁进行猜测
  winnerUserId: string | null;       // 获胜者ID
  logs: GuessRecord[];        // 全局对局记录日志
  restartRequests: string[];  // 请求再来一局的玩家ID列表
}

/**
 * 服务端私有的房间数据 (包含秘密数字)
 */
export interface ServerRoom extends Room {
  secrets: Record<string, string>; // userId -> secret
}
