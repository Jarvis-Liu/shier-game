import { createRoom } from '../../utils/roomManager'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { nickname, userId: bodyUserId } = body

  if (!nickname || nickname.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nickname is required'
    })
  }

  // 优先使用客户端传来的持久化ID，防止分身
  const userId = bodyUserId || uuidv4()
  const room = createRoom(nickname, userId)

  return {
    roomId: room.roomId,
    userId: userId,
    status: room.status
  }
})
