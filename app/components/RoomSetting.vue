<script setup lang="ts">
import { useRoomStore } from '~/stores/room'

const props = defineProps<{
  roomId: string
}>()

const roomStore = useRoomStore()
const { setSecret } = useSocketio()
const secret = ref('')
const isLocked = ref(false)
const toast = useToast()

const room = computed(() => roomStore.room)
const myPlayer = computed(() => room.value?.players.find(p => p.userId === roomStore.user?.userId))
const opponent = computed(() => room.value?.players.find(p => p.userId !== roomStore.user?.userId))
const isSpectator = computed(() => roomStore.myRole === 'spectator')

// 如果已经 ready (重连场景)，本地也显示锁定
onMounted(() => {
  if (myPlayer.value?.isReady) {
    isLocked.value = true
  }
})

function handleLock() {
  if (!/^\d{4}$/.test(secret.value)) {
    toast.add({ title: '请输入4位数字', color: 'error' })
    return
  }

  setSecret(props.roomId, secret.value)
  roomStore.setMySecret(secret.value)
  isLocked.value = true
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-2xl flex flex-col md:flex-row gap-8">
      <!-- 选手设置区 (非观众) -->
      <div
        v-if="!isSpectator"
        class="flex-1 sketch-box p-6 bg-white/60 relative"
      >
        <div
          v-if="isLocked"
          class="absolute inset-0 bg-success-ink/10 flex items-center justify-center z-10 rounded-lg"
        >
          <div class="bg-white px-4 py-2 sketch-box rotate-3 text-success-ink font-bold border-success-ink">
            已锁定
          </div>
        </div>

        <h3 class="font-bold text-pencil-grey mb-6 flex items-center gap-2">
          <UIcon name="i-lucide-shield-check" />
          设定你的秘密数字
        </h3>

        <div class="space-y-6">
          <UInput
            v-model="secret"
            type="password"
            maxlength="4"
            placeholder="****"
            size="xl"
            class="sketch-box text-center !text-3xl tracking-[1em]"
            :disabled="isLocked"
          />

          <p class="text-xs text-gray-500 italic">
            这将被作为本对局中对方需要破解的目标。
          </p>

          <UButton
            block
            label="确认锁定"
            color="primary"
            class="sketch-box watercolor-tap"
            :disabled="isLocked"
            @click="handleLock"
          />
        </div>
      </div>

      <!-- 观众观战区 -->
      <div
        v-else
        class="flex-1 sketch-box p-12 bg-white/40 flex flex-col items-center justify-center text-center space-y-6 border-dashed"
      >
        <div class="w-16 h-16 rounded-full bg-pencil-grey/10 flex items-center justify-center">
          <UIcon
            name="i-lucide-eye"
            class="w-8 h-8 text-pencil-grey animate-pulse"
          />
        </div>
        <div>
          <h3 class="text-xl font-bold text-pencil-grey">
            正在观战
          </h3>
          <p class="text-sm text-gray-500 mt-2 leading-relaxed">
            选手们正在紧锣密鼓地设定底牌...<br>
            精彩即将开始，请稍候。
          </p>
        </div>
      </div>

      <!-- 状态区 (选手视角显示对方，观众视角显示所有人) -->
      <div class="w-full md:w-64 space-y-4">
        <div
          v-for="p in (isSpectator ? room?.players : [opponent])"
          :key="p?.userId"
          class="sketch-box p-6 bg-gray-50/50 flex flex-col items-center justify-center space-y-4"
        >
          <UAvatar
            :alt="p?.nickname"
            size="xl"
          />
          <div class="text-center w-full">
            <p class="font-bold text-pencil-grey truncate">
              {{ p?.nickname }}
            </p>
            <div class="mt-2 flex items-center justify-center gap-2">
              <template v-if="p?.isReady">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="text-success-ink"
                />
                <span class="text-sm text-success-ink font-medium">已就绪</span>
              </template>
              <template v-else>
                <UIcon
                  name="i-lucide-hourglass"
                  class="animate-spin text-amber-500"
                />
                <span class="text-sm text-amber-500">正在思考...</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
