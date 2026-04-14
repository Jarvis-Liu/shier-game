<script setup>
const title = 'NumDecode - 数字破译'
const description = '逻辑博弈、休闲局域网/在线联机游戏，二次元手绘水彩风格。'

useHead({
  title,
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: description }
  ],
  htmlAttrs: {
    lang: 'zh-CN'
  }
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <!-- 全局背景纹理容器 -->
    <div class="min-h-screen relative overflow-hidden selection:bg-ink-blue">
      <!-- 纸张纹理注入器 (不可见) -->
      <svg class="absolute w-0 h-0 pointer-events-none">
        <filter id="paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04"
            numOctaves="5"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="saturate"
            values="0"
          />
          <feComponentTransfer>
            <feFuncR
              type="linear"
              slope="1.2"
            />
            <feFuncG
              type="linear"
              slope="1.2"
            />
            <feFuncB
              type="linear"
              slope="1.2"
            />
          </feComponentTransfer>
        </filter>
      </svg>

      <!-- 主要内容区域 -->
      <UMain class="relative z-10 min-h-screen">
        <NuxtPage />
      </UMain>
    </div>
  </UApp>
</template>

<style>
/* 确保字体加载和基础背景应用 */
body {
  margin: 0;
  padding: 0;
}
</style>
