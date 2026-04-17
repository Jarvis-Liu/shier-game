import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import { loadData, saveData } from './dataStore'
import { getNicknameById } from './userManager'

// 配置 dayjs 支持时区推算
dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * 获取当前北京时间的日期字符串 YYYY-MM-DD
 */
function getBeijingDateStr(): string {
  return dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD')
}

/**
 * 记录一次获胜
 * @param userId 获胜者的用户 ID
 */
export function recordWin(userId: string) {
  const data = loadData()
  const todayStr = getBeijingDateStr()

  // 跨天重置判断
  if (data.leaderboard.dateStr !== todayStr) {
    data.leaderboard = {
      dateStr: todayStr,
      records: {}
    }
  }

  // 以 userId 为 key 记录胜场，避免改名导致数据分裂
  const currentWins = data.leaderboard.records[userId] || 0
  data.leaderboard.records[userId] = currentWins + 1

  saveData(data)
}

/**
 * 获取当天排行榜前十
 */
export function getTopTen() {
  const data = loadData()
  const todayStr = getBeijingDateStr()

  // 如果日期不匹配，直接返回空
  if (data.leaderboard.dateStr !== todayStr) {
    return []
  }

  const records = data.leaderboard.records

  // 转换为数组，回填当前昵称，并按获胜次数降序排序
  const list = Object.entries(records).map(([userId, winCount]) => ({
    nickname: getNicknameById(userId) || '未知玩家',
    winCount
  }))

  list.sort((a, b) => b.winCount - a.winCount)

  return list.slice(0, 10)
}
