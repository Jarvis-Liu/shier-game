<script setup lang="ts">
const emit = defineEmits(['close'])

const loading = ref(true)
const list = ref<{ nickname: string, winCount: number }[]>([])

onMounted(async () => {
  try {
    const res = await $fetch('/api/leaderboard')
    list.value = res.data ?? []
  } catch (err) {
    console.error('Failed to load leaderboard', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div
    class="p-6 relative bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden min-h-[300px] border-2 border-pencil-grey sketch-box"
  >
    <!-- 装饰球 -->
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400 opacity-20 blur-3xl rounded-full" />
    <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-ink-blue opacity-10 blur-3xl rounded-full" />

    <div
      class="flex items-center justify-between mb-6 relative z-10 border-b border-gray-200 pb-3 font-handwriting"
    >
      <h2
        class="text-2xl font-bold flex items-center gap-2 text-pencil-grey"
      >
        <UIcon
          name="i-lucide-trophy"
          class="w-8 h-8 text-yellow-500 fall-animation"
        />
        风云榜
      </h2>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        class="hover:bg-gray-100 rounded-full hover:rotate-90 transition-transform"
        @click="emit('close')"
      />
    </div>

    <div class="relative z-10 space-y-4">
      <div
        v-if="loading"
        class="flex justify-center py-8"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-10 h-10 animate-spin text-primary opacity-70"
        />
      </div>

      <div
        v-else-if="list.length === 0"
        class="text-center py-12 text-gray-500 font-medium"
      >
        <UIcon
          name="i-lucide-inbox"
          class="w-12 h-12 mx-auto mb-2 opacity-30 text-pencil-grey"
        />
        <p class="font-handwriting text-lg text-pencil-grey">
          今日暂无挑战者拔得头筹！
          <br>
          虚位以待，等你来战。
        </p>
      </div>

      <div
        v-else
        class="space-y-3 font-medium"
      >
        <div
          v-for="(item, index) in list"
          :key="index"
          class="flex items-center p-3 rounded-xl bg-white/60 hover:bg-white border border-gray-200 shadow-sm transition-all hover:scale-[1.02]"
        >
          <!-- 排名编号 -->
          <div
            class="w-8 h-8 flex items-center justify-center font-bold mr-3 rounded-full shadow-inner font-mono text-sm border"
            :class="
              index === 0 ? 'bg-yellow-100 text-yellow-600 border-yellow-200'
              : index === 1 ? 'bg-gray-200 text-gray-600 border-gray-300'
                : index === 2 ? 'bg-orange-100 text-orange-600 border-orange-200'
                  : 'bg-gray-50 text-gray-400 border-gray-100'
            "
          >
            {{ index + 1 }}
          </div>

          <!-- Tooltip 及文本截断 -->
          <UTooltip
            :text="item.nickname"
            class="flex-1 min-w-0 mr-4"
          >
            <div class="font-bold text-pencil-grey truncate max-w-full font-handwriting text-lg">
              {{ item.nickname }}
            </div>
          </UTooltip>

          <div
            class="flex items-center justify-center gap-1 px-3 py-1 bg-primary/10 rounded-full text-sm shrink-0 border border-primary/20"
          >
            <UIcon
              name="i-lucide-award"
              class="w-4 h-4 text-primary"
            />
            <span class="font-bold text-primary">
              {{ item.winCount }}
              <span class="text-xs opacity-70">胜</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fall-animation {
  animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes bounce-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.font-handwriting {
  font-family: var(--font-handwriting), 'Comic Sans MS', cursive, sans-serif;
}
</style>
