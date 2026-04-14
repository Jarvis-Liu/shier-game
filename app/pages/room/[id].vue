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
const isSettingsOpen = ref(false)
const localConfig = ref({ hideOpponentGuess: true })

// 当弹窗打开时，同步当前的房间设置到本地临时副本
watch(isSettingsOpen, (val) => {
  if (val && room.value?.config) {
    localConfig.value = { ...room.value.config }
  }
})

const { updateConfig } = useSocketio()

function saveConfig() {
  if (roomStore.isHost) {
    updateConfig(roomId, { ...localConfig.value })
    toast.add({ title: '设置已应用', color: 'success', timeout: 2000 })
  }
  isSettingsOpen.value = false
}
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
        <!-- 房主设置入口 -->
        <UButton
          v-if="roomStore.isHost"
          icon="i-lucide-settings-2"
          variant="soft"
          color="neutral"
          size="sm"
          class="sketch-box !p-2"
          @click="isSettingsOpen = true"
        />

        <div v-for="player in room?.players" :key="player.userId" class="flex items-center gap-2">
          <UAvatar :alt="player.nickname" size="sm" />
          <span class="text-sm font-medium" :class="player.userId === roomStore.user?.userId ? 'text-primary' : 'text-pencil-grey'">
            {{ player.nickname }}
            <span v-if="player.role === 'host'" class="text-[10px] bg-amber-100 text-amber-600 px-1 rounded ml-1">房主</span>
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

    <!-- 自定义高可靠性原生手绘风设置弹窗 (仅限房主) -->
    <div v-if="isSettingsOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pencil-grey/40 backdrop-blur-sm animate-fade-in">
      <div class="relative w-full max-w-md sketch-box bg-white border-4 border-pencil-grey shadow-2xl overflow-hidden animate-slide-up">
        
        <!-- Header -->
        <div class="p-5 border-b-2 border-pencil-grey/20 flex items-center justify-between bg-gray-50/80">
          <h3 class="text-xl font-bold text-pencil-grey flex items-center gap-2">
            <UIcon name="i-lucide-settings-2" class="w-6 h-6" />
            对局配置
          </h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            @click="isSettingsOpen = false"
          />
        </div>
        
        <!-- Body -->
        <div class="p-6 space-y-6">
          <div class="flex items-center justify-between p-4 bg-gray-50/50 sketch-box !border-dashed transition-all">
            <div class="pr-4 flex-1">
              <p class="font-bold text-pencil-grey text-lg">隐藏对手猜数字</p>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">关闭后，你可以实时查阅对方每一次猜测的具体 4 位数字，可以极大降低对局门槛。</p>
            </div>
            
            <!-- 原生高保真手写开关 -->
            <button 
              type="button"
              class="relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-pencil-grey sketch-box transition-colors duration-200 ease-in-out px-1"
              :class="localConfig.hideOpponentGuess ? 'bg-success-ink/20' : 'bg-gray-100'"
              @click="localConfig.hideOpponentGuess = !localConfig.hideOpponentGuess"
            >
              <span class="sr-only">Toggle</span>
              <span 
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-pencil-grey shadow ring-0 transition duration-200 ease-in-out"
                :class="localConfig.hideOpponentGuess ? 'translate-x-3' : '-translate-x-3'"
              />
            </button>
          </div>
          
          <div class="px-4 py-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700 leading-relaxed italic text-center font-handwriting">
            提示：为了保证公平，设定的改变将在保存后下发同步至对方。
          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 bg-gray-50">
          <UButton
            block
            label="完成并关闭"
            color="primary"
            class="sketch-box watercolor-tap font-bold text-lg"
            @click="saveConfig"
          />
        </div>
      </div>
    </div>
    
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
