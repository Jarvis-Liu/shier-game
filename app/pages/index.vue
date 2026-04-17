<script setup lang="ts">
import { useRoomStore } from '~/stores/room'

const roomStore = useRoomStore()
const nickname = ref('')
const joinRoomId = ref('')
const loading = ref(false)
const toast = useToast()
const showHelp = ref(false)
const showLeaderboard = ref(false)

// 初始化时从 localStorage 加载昵称
onMounted(() => {
  const saved = localStorage.getItem('numdecode_nickname')
  if (saved) {
    nickname.value = saved
  }
})

async function verifyNickname(): Promise<boolean> {
  try {
    const res = await $fetch('/api/user/verify', {
      method: 'POST',
      body: {
        userId: roomStore.user?.userId,
        nickname: nickname.value
      }
    })
    return res.success || false
  } catch (err: unknown) {
    const fetchErr = err as { response?: { _data?: { statusMessage?: string } } }
    const message = fetchErr?.response?._data?.statusMessage || '服务异常，昵称校验失败'
    toast.add({ title: message, color: 'error' })
    return false
  }
}

// 创建房间
async function handleCreate() {
  if (!nickname.value.trim()) {
    toast.add({ title: '请输入昵称', color: 'error' })
    return
  }

  loading.value = true
  roomStore.initUser(nickname.value)

  if (!(await verifyNickname())) {
    loading.value = false
    return
  }

  try {
    const data = await $fetch('/api/room/create', {
      method: 'POST',
      body: {
        nickname: nickname.value,
        userId: roomStore.user?.userId
      }
    })

    // 跳转到房间页
    navigateTo(`/room/${data.roomId}`)
  } catch (err) {
    toast.add({ title: '创建失败', description: '请稍后再试', color: 'error' })
  } finally {
    loading.value = false
  }
}

// 加入房间
async function handleJoin() {
  if (!nickname.value.trim()) {
    toast.add({ title: '请输入昵称', color: 'error' })
    return
  }
  if (!/^\d{4}$/.test(joinRoomId.value)) {
    toast.add({ title: '请输入4位数字房间号', color: 'error' })
    return
  }

  loading.value = true
  roomStore.initUser(nickname.value)

  if (!(await verifyNickname())) {
    loading.value = false
    return
  }

  try {
    const check = await $fetch(`/api/room/check/${joinRoomId.value}`)
    if (!check.exists) {
      toast.add({ title: '房间不存在', color: 'error' })
      return
    }

    navigateTo(`/room/${joinRoomId.value}`)
  } catch (err) {
    toast.add({ title: '加入失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

// 处理点击时的水彩扩散位置
function handlePointerDown(e: PointerEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  target.style.setProperty('--x', `${x}%`)
  target.style.setProperty('--y', `${y}%`)
}
</script>

<template>
  <div class="relative min-h-screen">
    <!-- 右上角悬浮操作区 -->
    <div class="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex flex-col gap-3">
      <!-- 帮助 -->
      <UModal v-model:open="showHelp">
        <UButton
          icon="i-lucide-circle-help"
          size="xl"
          color="neutral"
          variant="ghost"
          class="hover:scale-110 transition-transform text-pencil-grey/70 hover:text-pencil-grey bg-white/50 backdrop-blur-sm rounded-full shadow-sm"
        />
        <template #content>
          <GameHelpModal @close="showHelp = false" />
        </template>
      </UModal>

      <!-- 排行榜 -->
      <UModal v-model:open="showLeaderboard">
        <UButton
          icon="i-lucide-trophy"
          size="xl"
          color="warning"
          variant="ghost"
          class="hover:scale-110 transition-transform text-yellow-600 bg-white/50 backdrop-blur-sm rounded-full shadow-sm"
        />
        <template #content>
          <LeaderboardModal @close="showLeaderboard = false" />
        </template>
      </UModal>
    </div>

    <div class="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-12">
      <!-- 标题区 -->
      <div class="mb-12 text-center animate-bounce-slow">
        <h1 class="text-6xl font-bold tracking-tighter text-pencil-grey mb-2 drop-shadow-sm">
          NumDecode
        </h1>
        <p class="text-xl text-gray-500 font-handwriting">
          数字破译：逻辑与直觉的博弈
        </p>
      </div>

      <!-- 主控制台 -->
      <div class="w-full max-w-sm sketch-box p-8 space-y-8 bg-white/60 backdrop-blur-sm relative overflow-hidden">
        <!-- 装饰用水彩印记 -->
        <div class="absolute -top-10 -right-10 w-24 h-24 bg-ink-blue opacity-20 blur-2xl rounded-full" />

        <!-- 核心表单 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1 ml-1">玩家昵称</label>
            <UInput
              v-model="nickname"
              placeholder="输入你的代号..."
              size="xl"
              maxlength="14"
              color="neutral"
              variant="none"
              class="sketch-box !rotate-[0.2deg] bg-white border-2 border-pencil-grey"
            />
          </div>

          <div class="pt-4 border-t border-dashed border-gray-400">
            <UButton
              block
              size="xl"
              label="创建对局"
              variant="outline"
              :loading="loading"
              class="sketch-box !rotate-[-0.3deg] watercolor-tap hover:scale-105 active:scale-95 transition-transform"
              @pointerdown="handlePointerDown"
              @click="handleCreate"
            />
          </div>

          <div class="relative py-4 flex items-center">
            <div class="flex-grow border-t border-gray-300" />
            <span class="flex-shrink mx-4 text-gray-400 text-sm">或者加入</span>
            <div class="flex-grow border-t border-gray-300" />
          </div>

          <div class="flex gap-2">
            <UInput
              v-model="joinRoomId"
              placeholder="房间号"
              maxlength="4"
              class="flex-1 sketch-box !rotate-[0.1deg] border-2 border-pencil-grey"
            />
            <UButton
              icon="i-lucide-arrow-right"
              color="primary"
              variant="outline"
              :loading="loading"
              class="sketch-box !rotate-[0.5deg] watercolor-tap"
              @pointerdown="handlePointerDown"
              @click="handleJoin"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-bounce-slow {
  animation: bounce 3s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
