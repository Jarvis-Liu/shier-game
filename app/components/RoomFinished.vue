<script setup lang="ts">
import { useRoomStore } from '~/stores/room'

const props = defineProps<{
  roomId: string
}>()

const roomStore = useRoomStore()
const { restartGame } = useSocketio()

const room = computed(() => roomStore.room)
const isWinner = computed(() => room.value?.winnerUserId === roomStore.user?.userId)
const winnerNickname = computed(() => room.value?.players.find(p => p.userId === room.value?.winnerUserId)?.nickname)
const restartCount = computed(() => room.value?.restartRequests.length || 0)
const hasRequestedRestart = computed(() => room.value?.restartRequests.includes(roomStore.user?.userId || ''))
const isSpectator = computed(() => roomStore.myRole === 'spectator')

function handleRestart() {
  restartGame(props.roomId)
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md sketch-box p-12 bg-white/80 relative overflow-hidden text-center space-y-8 animate-pop">
      <!-- 胜利/失败/全场印章 -->
      <div
        class="absolute -top-4 -right-4 w-40 h-40 opacity-20 rotate-12 pointer-events-none"
        :class="isWinner || isSpectator ? 'text-success-ink' : 'text-fail-ink'"
      >
        <UIcon
          :name="isWinner || isSpectator ? 'i-lucide-trophy' : 'i-lucide-skull'"
          class="w-full h-full"
        />
      </div>

      <div v-if="!isSpectator">
        <h2 
          class="text-6xl font-bold mb-2 font-handwriting tracking-widest"
          :class="isWinner ? 'text-success-ink' : 'text-fail-ink'"
        >
          {{ isWinner ? '大胜！' : '惜败...' }}
        </h2>
        <p class="text-gray-500 italic">
          破译结果已盖章入库
        </p>
      </div>
      <div v-else>
        <h2 class="text-5xl font-bold mb-2 font-handwriting tracking-widest text-pencil-grey">
          对局结束
        </h2>
        <p class="text-lg text-primary font-bold italic mt-4">
          胜者：{{ winnerNickname }}
        </p>
      </div>

      <!-- 底牌展示 (选手视角) -->
      <div
        v-if="!isSpectator"
        class="grid grid-cols-2 gap-4 py-8 border-y-2 border-dashed border-gray-200"
      >
        <div class="space-y-2">
          <p class="text-xs text-gray-400">
            您的底牌
          </p>
          <span class="text-2xl font-bold font-mono tracking-widest text-pencil-grey">
            {{ room?.finalSecrets?.[roomStore.user?.userId || ''] || '****' }}
          </span>
        </div>
        <div class="space-y-2">
          <p class="text-xs text-gray-400">
            对方底牌
          </p>
          <span class="text-2xl font-bold font-mono tracking-widest text-primary">
            {{ room?.finalSecrets?.[room?.players.find(p => p.userId !== roomStore.user?.userId)?.userId || ''] || '****' }}
          </span>
        </div>
      </div>

      <!-- 底牌展示 (观众视角) -->
      <div
        v-else
        class="grid grid-cols-2 gap-4 py-8 border-y-2 border-dashed border-gray-200"
      >
        <div
          v-for="p in room?.players"
          :key="p.userId"
          class="space-y-2"
        >
          <p class="text-xs text-gray-400">
            {{ p.nickname }} 的底牌
          </p>
          <span
            class="text-2xl font-bold font-mono tracking-widest"
            :class="p.userId === room?.winnerUserId ? 'text-primary' : 'text-pencil-grey'"
          >
            {{ room?.finalSecrets?.[p.userId] || '****' }}
          </span>
        </div>
      </div>

      <div class="space-y-4">
        <template v-if="!isSpectator">
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
        </template>
        <template v-else>
          <div class="py-2 text-sm text-gray-400 italic">
            等待选手决定是否再来一局... ({{ restartCount }}/2)
          </div>
        </template>
        
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
