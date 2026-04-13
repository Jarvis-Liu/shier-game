<script setup lang="ts">
import { useRoomStore } from '~/stores/room'

const props = defineProps<{
  roomId: string
}>()

const roomStore = useRoomStore()
const { restartGame } = useSocketio()

const room = computed(() => roomStore.room)
const isWinner = computed(() => room.value?.winnerUserId === roomStore.user?.userId)
const restartCount = computed(() => room.value?.restartRequests.length || 0)
const hasRequestedRestart = computed(() => room.value?.restartRequests.includes(roomStore.user?.userId || ''))

function handleRestart() {
  restartGame(props.roomId)
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md sketch-box p-12 bg-white/80 relative overflow-hidden text-center space-y-8 animate-pop">
      <!-- 胜利/失败印章 -->
      <div 
        class="absolute -top-4 -right-4 w-40 h-40 opacity-20 rotate-12 pointer-events-none"
        :class="isWinner ? 'text-success-ink' : 'text-fail-ink'"
      >
        <UIcon 
          :name="isWinner ? 'i-lucide-trophy' : 'i-lucide-skull'" 
          class="w-full h-full"
        />
      </div>

      <div>
        <h2 
          class="text-6xl font-bold mb-2 font-handwriting tracking-widest"
          :class="isWinner ? 'text-success-ink' : 'text-fail-ink'"
        >
          {{ isWinner ? '大胜！' : '惜败...' }}
        </h2>
        <p class="text-gray-500 italic">破译结果已盖章入库</p>
      </div>

      <!-- 底牌展示 -->
      <div class="grid grid-cols-2 gap-4 py-8 border-y-2 border-dashed border-gray-200">
        <div class="space-y-2">
          <p class="text-xs text-gray-400">
            您的底牌
          </p>
          <span class="text-2xl font-bold font-mono tracking-widest text-pencil-grey">
            {{ (room as any)?.finalSecrets?.[roomStore.user?.userId || ''] || '****' }}
          </span>
        </div>
        <div class="space-y-2">
          <p class="text-xs text-gray-400">
            对方底牌
          </p>
          <span class="text-2xl font-bold font-mono tracking-widest text-primary">
            {{ (room as any)?.finalSecrets?.[room?.players.find(p => p.userId !== roomStore.user?.userId)?.userId || ''] || '****' }}
          </span>
        </div>
      </div>

      <!-- 操作 -->
      <div class="space-y-4">
        <UButton
          block
          size="xl"
          :variant="hasRequestedRestart ? 'outline' : 'solid'"
          class="sketch-box watercolor-tap"
          :disabled="hasRequestedRestart"
          @click="handleRestart"
        >
          {{ hasRequestedRestart ? `已请求再来一局 (${restartCount}/2)` : '再来一局' }}
        </UButton>
        <UButton
          block
          size="lg"
          variant="ghost"
          label="返回大厅"
          @click="navigateTo('/')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pop {
  animation: pop-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.8) rotate(-5deg); filter: blur(10px); }
  to { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
}
</style>
