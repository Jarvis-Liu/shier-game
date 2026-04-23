import { verifyAndRegisterUser } from '../../utils/userManager'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, nickname } = body

  if (!userId || !nickname) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少用户ID或昵称'
    })
  }

  const error = verifyAndRegisterUser(userId, nickname)

  if (error) {
    throw createError({
      statusCode: 409,
      statusMessage: error
    })
  }

  return { success: true }
})
