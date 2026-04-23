import { createRoom } from '../../utils/roomManager'
import { verifyAndRegisterUser } from '../../utils/userManager'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { nickname, userId: bodyUserId } = body

  if (!nickname || nickname.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '昵称不能为空'
    })
  }

  // 优先使用客户端传来的持久化ID，防止分身
  const userId = bodyUserId || uuidv4()

  // 防御性校验：确保昵称已注册且未被他人占用
  const verifyError = verifyAndRegisterUser(userId, nickname)
  if (verifyError) {
    throw createError({
      statusCode: 409,
      statusMessage: verifyError
    })
  }

  const room = createRoom(nickname, userId)

  return {
    roomId: room.roomId,
    userId: userId,
    status: room.status
  }
})
