import { getRawRoom } from '../../../utils/roomManager'

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, 'id')

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID is required'
    })
  }

  const room = getRawRoom(roomId)

  if (!room) {
    return {
      exists: false
    }
  }

  return {
    exists: true,
    status: room.status,
    playerCount: room.players.length
  }
})
