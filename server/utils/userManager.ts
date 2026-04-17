import { loadData, saveData } from './dataStore'

/**
 * 校验并注册用户昵称
 * @param userId 用户唯一ID
 * @param nickname 用户请求的昵称
 * @returns 成功返回 null，失败返回具体错误消息
 */
export function verifyAndRegisterUser(userId: string, nickname: string): string | null {
  if (!nickname || nickname.trim().length === 0) {
    return '昵称不能为空'
  }

  // 限制昵称最长 14 个字符
  if (nickname.length > 14) {
    return '昵称不能超过14个字符'
  }

  const data = loadData()

  // 检查是否已被别人使用
  const isUsedByOther = Object.entries(data.users).some(
    ([id, name]) => name === nickname && id !== userId
  )

  if (isUsedByOther) {
    return '昵称已被占用，请换一个'
  }

  // 未被占用，或者是自己之前注册的，记录/更新
  data.users[userId] = nickname
  saveData(data)

  return null
}

/**
 * 根据 userId 获取记录的真实昵称（用于排行榜回填等操作防止伪造）
 */
export function getNicknameById(userId: string): string | null {
  const data = loadData()
  return data.users[userId] || null
}
