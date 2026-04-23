import { ref, onUnmounted } from 'vue'

/**
 * 浏览器标题通知 Composable
 * 用于在特定条件下通过闪烁标题提醒用户
 */
export const useTitleNotification = () => {
  // 当前正在显示的标题
  const displayTitle = ref('')
  const isFlashing = ref(false)
  
  let timer: ReturnType<typeof setInterval> | null = null
  let originalTitle = ''

  // 挂载标题到 head
  useHead({
    title: displayTitle
  })

  /**
   * 开始闪烁标题
   * @param flashMsg 闪烁时显示的提醒文字
   */
  const startFlash = (flashMsg: string) => {
    if (isFlashing.value || typeof window === 'undefined') return
    
    // 如果没有记录过原始标题，或者当前显示的不是提醒文字，则记录
    if (!originalTitle) {
      originalTitle = document.title || '十儿游戏'
    }
    
    displayTitle.value = originalTitle
    isFlashing.value = true
    
    timer = setInterval(() => {
      displayTitle.value = displayTitle.value === originalTitle ? flashMsg : originalTitle
    }, 1000)
  }

  /**
   * 停止闪烁并恢复原始标题
   */
  const stopFlash = () => {
    if (!isFlashing.value) return
    
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    
    isFlashing.value = false
    if (originalTitle) {
      displayTitle.value = originalTitle
    }
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    stopFlash()
  })

  return {
    startFlash,
    stopFlash,
    isFlashing
  }
}
