<script setup lang="ts">
import { useRoomStore } from "~/stores/room";

const props = defineProps<{
  roomId: string;
}>();

const roomStore = useRoomStore();
const { submitGuess } = useSocketio();
const currentGuess = ref("");
const logContainer = ref<HTMLElement | null>(null);
const showSecret = ref(false); // 控制秘密数字显隐

const room = computed(() => roomStore.room);
const isMyTurn = computed(() => roomStore.isMyTurn);

// 浏览器标题提醒逻辑
const { startFlash, stopFlash } = useTitleNotification();

// 监听回合变化
watch(isMyTurn, (newVal) => {
  if (newVal && document.visibilityState === "hidden") {
    startFlash("【★ 轮到你了 ★】");
  } else if (!newVal) {
    stopFlash();
  }
});

// 处理页面可见性变化
const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    stopFlash();
  } else if (isMyTurn.value) {
    startFlash("【★ 轮到你了 ★】");
  }
};

onMounted(() => {
  if (process.client) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
});

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
});

// 输入逻辑
function pressNumber(num: number) {
  if (currentGuess.value.length < 4) {
    currentGuess.value += num.toString();
  }
}

function clear() {
  currentGuess.value = "";
}

function handleSubmit() {
  if (currentGuess.value.length === 4) {
    submitGuess(props.roomId, currentGuess.value);
    currentGuess.value = "";
  }
}

// 自动滚动日志
watch(
  () => room.value?.logs.length,
  () => {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
      }
    });
  },
);
</script>

<template>
  <div class="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
    <!-- 左侧：对战日志 (Battle Log) -->
    <div
      class="flex-1 sketch-box bg-white/50 flex flex-col h-[400px] md:h-auto"
    >
      <div
        class="p-4 border-b border-gray-200 bg-gray-50/50 font-bold text-sm text-pencil-grey flex justify-between"
      >
        <span>对战日志 ({{ room?.logs.length }})</span>
        <span class="text-xs font-normal text-gray-400 font-handwriting"
          >保持逻辑严密...</span
        >
      </div>

      <div
        ref="logContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4 font-mono"
      >
        <div
          v-for="(log, idx) in room?.logs"
          :key="idx"
          class="flex flex-col gap-1 animate-ink-bleed"
        >
          <!-- 回合数标签：居中显示，每回合仅显示一次 -->
          <div v-if="idx % 2 === 0" class="text-center pt-2">
            <span class="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              第 {{ Math.floor(idx / 2) + 1 }} 回合
            </span>
          </div>

          <!-- 日志内容气泡：根据身份左右对齐 -->
          <div
            class="flex items-start gap-2 text-sm w-full"
            :class="log.userId === roomStore.user?.userId ? 'flex-row-reverse' : 'flex-row'"
          >
            <div
              class="max-w-[85%] p-2 rounded-lg border shadow-sm transition-all"
              :class="[
                log.userId === roomStore.user?.userId
                  ? 'bg-ink-blue/5 border-ink-blue/20 rounded-tr-none'
                  : 'bg-ink-orange/5 border-ink-orange/20 rounded-tl-none'
              ]"
            >
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="text-xs font-bold"
                  :class="log.userId === roomStore.user?.userId ? 'text-ink-blue' : 'text-ink-orange'"
                >
                  {{ room?.players.find(p => p.userId === log.userId)?.nickname }}
                </span>
              </div>

              <div class="flex items-baseline gap-2">
                <span class="text-lg font-bold tracking-widest">
                  <!-- 显示逻辑：自己发起的、对局已结束、或者配置中未开启隐藏 => 显示明文 -->
                  <template v-if="log.userId === roomStore.user?.userId || room?.status === 'FINISHED' || room?.config?.hideOpponentGuess === false">
                    {{ log.guessNumber }}
                  </template>
                  <template v-else>
                    ****
                  </template>
                </span>
                <span
                  class="text-xs px-1.5 py-0.5 rounded border"
                  :class="log.correctCount === 0 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-success-ink/10 text-success-ink border-success-ink/20 font-bold'"
                >
                  ✓ {{ log.correctCount }} 个对
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：操作台 (Console) -->
    <div class="w-full md:w-80 flex flex-col space-y-4">
      <!-- 我的底牌 (My Secret Number) -->
      <div 
        v-if="roomStore.mySecret"
        class="sketch-box p-3 bg-pencil-grey/5 border-dashed flex items-center justify-between group transition-all hover:bg-pencil-grey/10"
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-shield-half" class="text-pencil-grey/40" />
          <span class="text-xs font-bold text-pencil-grey/60 uppercase tracking-wider">我的底牌</span>
        </div>
        <div class="flex items-center gap-3">
          <span 
            class="font-mono font-bold tracking-[0.2em] transition-all"
            :class="showSecret ? 'text-pencil-grey text-sm' : 'text-pencil-grey/20 blur-[2px] text-xs'"
          >
            {{ showSecret ? roomStore.mySecret : '****' }}
          </span>
          <UButton
            :icon="showSecret ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            variant="ghost"
            color="gray"
            size="xs"
            class="rounded-full !p-1 hover:bg-white/50"
            @click="showSecret = !showSecret"
          />
        </div>
      </div>

      <!-- 轮次状态 -->
      <div
        class="sketch-box p-4 text-center transition-all duration-500"
        :class="
          isMyTurn
            ? 'bg-ink-blue/10 scale-105 border-ink-blue border-4'
            : 'bg-gray-100 opacity-60 grayscale'
        "
      >
        <p class="font-bold text-pencil-grey">
          {{ isMyTurn ? "您的回合" : "等待对手..." }}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          {{ isMyTurn ? "请根据以往日志推导真相" : "对方正在构思策略" }}
        </p>
      </div>

      <!-- 输入显示 -->
      <div
        class="sketch-box p-4 bg-white border-2 border-pencil-grey text-center min-h-[80px] flex items-center justify-center"
      >
        <span class="text-4xl font-bold tracking-[0.5em] text-pencil-grey">
          {{ currentGuess.padEnd(4, "_") }}
        </span>
      </div>

      <!-- 数字键盘 -->
      <div
        class="grid grid-cols-3 gap-3 p-2 sketch-box bg-white/40"
        :class="{ 'pointer-events-none grayscale opacity-50': !isMyTurn }"
      >
        <UButton
          v-for="n in 9"
          :key="n"
          variant="outline"
          size="xl"
          class="sketch-box !rotate-1 hover:bg-gray-50"
          @click="pressNumber(n)"
        >
          {{ n }}
        </UButton>
        <UButton
          icon="i-lucide-delete"
          variant="ghost"
          color="error"
          class="sketch-box"
          @click="clear"
        />
        <UButton
          variant="outline"
          size="xl"
          class="sketch-box"
          @click="pressNumber(0)"
        >
          0
        </UButton>
        <UButton
          icon="i-lucide-check-circle"
          color="primary"
          class="sketch-box watercolor-tap"
          :disabled="currentGuess.length < 4"
          @click="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-ink-bleed {
  animation: ink-bloom 0.5s ease-out forwards;
}

@keyframes ink-bloom {
  from {
    opacity: 0;
    transform: translateX(-5px);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
}
</style>
