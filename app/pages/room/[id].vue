<script setup lang="ts">
import { useRoomStore } from '~/stores/room'
import { RoomStatus } from '~/../shared/types'

const route = useRoute()
const roomId = route.params.id as string
const roomStore = useRoomStore()
const { connect, disconnect } = useSocketio()
const toast = useToast()

// 如果没有用户名，直接弹退回家
onMounted(() => {
  if (!roomStore.user?.nickname) {
    const saved = localStorage.getItem('numdecode_nickname')
    if (saved) {
      roomStore.initUser(saved)
    } else {
      toast.add({ title: '请先设置昵称', color: 'warning' })
      navigateTo('/')
      return
    }
  }

  // 建立 WS 连接
  connect(roomId)
})

onUnmounted(() => {
  disconnect()
})

const room = computed(() => roomStore.room)
</script>

<template>
  <div class="min-h-screen p-4 md:p-8 flex flex-col items-center">
    <!-- 顶部状态栏 -->
    <header class="w-full max-w-4xl flex justify-between items-center mb-8 px-4 py-3 sketch-box bg-white/40">
      <div class="flex items-center gap-4">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          @click="navigateTo('/')"
        />
        <div>
          <h2 class="font-bold text-pencil-grey">房间: {{ roomId }}</h2>
          <p class="text-xs text-gray-500">状态: {{ room?.status || '连接中...' }}</p>
        </div>
      </div>
      
      <div class="flex gap-4 items-center">
        <div v-for="player in room?.players" :key="player.userId" class="flex items-center gap-2">
          <UAvatar :alt="player.nickname" size="sm" />
          <span class="text-sm font-medium" :class="player.userId === roomStore.user?.userId ? 'text-primary' : 'text-pencil-grey'">
            {{ player.nickname }}
            <span v-if="player.role === 'host'" class="text-[10px] bg-amber-100 text-amber-600 px-1 rounded">房主</span>
          </span>
        </div>
      </div>
    </header>

    <!-- 动态视图切换 -->
    <main class="w-full max-w-4xl flex-1 flex flex-col">
      <template v-if="!room">
        <div class="flex-1 flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-12 h-12 animate-spin text-ink-blue" />
        </div>
      </template>

      <template v-else>
        <!-- 等待对手 -->
        <RoomWaiting
          v-if="room.status === RoomStatus.WAITING"
          :room-id="roomId"
        />

        <!-- 准备阶段 (设置数字) -->
        <RoomSetting
          v-else-if="room.status === RoomStatus.SETTING"
          :room-id="roomId"
        />

        <!-- 对战阶段 -->
        <RoomPlaying
          v-else-if="room.status === RoomStatus.PLAYING"
          :room-id="roomId"
        />

        <!-- 结算阶段 -->
        <RoomFinished
          v-else-if="room.status === RoomStatus.FINISHED"
          :room-id="roomId"
        />
      </template>
    </main>
    
    <!-- 观众席 (始终显示) -->
    <footer v-if="room?.spectators.length" class="mt-8 w-full max-w-4xl p-4 bg-gray-100/30 rounded-lg">
      <p class="text-xs text-gray-400 mb-2 px-2">观众 ({{ room.spectators.length }})</p>
      <div class="flex flex-wrap gap-2">
        <span v-for="s in room.spectators" :key="s.userId" class="text-xs px-2 py-1 bg-white/50 rounded border border-gray-200">
          {{ s.nickname }}
        </span>
      </div>
    </footer>
  </div>
</template>
