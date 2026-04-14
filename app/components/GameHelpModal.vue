<script setup lang="ts">
defineEmits(['close'])
</script>

<template>
  <div class="p-6 sketch-box bg-white font-handwriting space-y-4">
    <h2 class="text-3xl font-bold text-pencil-grey border-b-2 border-dashed border-gray-300 pb-2">
      关于 NumDecode
    </h2>

    <div class="space-y-3 text-lg text-gray-700 leading-relaxed">
      <p>这是一场关于逻辑、概率与直觉的巅峰对局。你的目标是在对方破译你的密码之前，先一步解开他们的秘密数字。</p>

      <div class="bg-blue-50/50 p-4 rounded-lg border border-blue-100 italic">
        "在数字的迷雾中，每一次猜测都是一次试探，每一个反馈都是一道曙光。"
      </div>

      <h3 class="text-xl font-bold text-ink-blue pt-2">
        如何玩？
      </h3>
      <ul class="list-disc list-inside space-y-2 ml-2">
        <li>
          <span class="font-bold text-pencil-grey">设定密码：</span>每局开始，双方各自设定一个 <span class="underline underline-offset-4 decoration-wavy decoration-ink-blue">不重复的 4 位数字</span>。
        </li>
        <li>
          <span class="font-bold text-pencil-grey">进行推演：</span>轮流输入你猜测的数字，系统会返回提示信息。
        </li>
        <li>
          <span class="font-bold text-pencil-grey">解读提示：</span>系统会告诉你 <span class="font-bold text-success-ink">猜对的数字个数（含位置）</span>，你需要根据这些线索逐步锁定正确密码。
        </li>
      </ul>

      <div class="mt-4 p-3 bg-pencil-grey/5 border-l-4 border-pencil-grey text-sm">
        <span class="font-bold">示例：</span> 若对方数字是 1234，你猜 1478，系统会提示有 <span class="font-bold text-pencil-grey">✓ 2 个对</span>。
      </div>

      <p class="text-center pt-4 font-bold text-pencil-grey animate-pulse">
        谁最先准确猜出对方的全部 4 位数字，谁就是最终的“破译大师”！
      </p>
    </div>

    <div class="flex justify-end pt-4">
      <UButton
        label="准备好了"
        color="neutral"
        variant="outline"
        class="sketch-box !rotate-[-1deg]"
        @click="$emit('close')"
      />
    </div>
  </div>
</template>
