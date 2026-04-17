import { getTopTen } from '../../utils/leaderboard'

export default defineEventHandler(() => {
  return {
    success: true,
    data: getTopTen()
  }
})
