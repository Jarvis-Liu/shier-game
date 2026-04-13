<script setup lang="ts">
const props = defineProps<{
  roomId: string
}>()

const toast = useToast()

function copyRoomId() {
  navigator.clipboard.writeText(props.roomId)
  toast.add({ title: '已复制房间号', color: 'success' })
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center space-y-8">
    <div class="relative">
      <!-- 旋转的水彩圆圈背景 -->
      <div class="absolute inset-0 bg-ink-blue opacity-20 blur-xl animate-pulse rounded-full scale-150" />

      <div class="sketch-box p-12 bg-white/70 relative z-10 text-center space-y-6">
        <h3 class="text-2xl font-bold text-pencil-grey">
          等待对手加入...
        </h3>

        <div class="space-y-2">
          <p class="text-sm text-gray-500">
            把房间号分享给你的好友
          </p>
          <div
            class="flex items-center gap-4 px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-white transition-colors"
            @click="copyRoomId"
          >
            <span class="text-4xl font-mono tracking-widest font-bold text-primary">
              {{ roomId }}
            </span>
            <UIcon
              name="i-lucide-copy"
              class="text-gray-400"
            />
          </div>
        </div>

        <div class="flex items-center justify-center gap-2 text-gray-400 animate-pulse">
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin"
          />
          <span class="text-xs">正在搜索信号中...</span>
        </div>
      </div>
    </div>
  </div>
</template>
