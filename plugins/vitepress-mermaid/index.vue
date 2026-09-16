<template>
  <div
    :key="theme"
    ref="diagramRef"
    class="mermaid"
    :style="{ minHeight: fixedHeight }"
  >
    {{ value }}
  </div>
</template>

<script setup lang="ts">
import { useData } from "vitepress";
import { computed, ref, watch, nextTick, onMounted } from "vue";

defineProps<{
  value?: string;
}>();

const { isDark } = useData();
const theme = computed(() => (isDark.value ? "dark" : "default"));

const diagramRef = ref<HTMLElement | null>(null);
const fixedHeight = ref<string>("auto");

async function renderDiagram() {
  if (typeof window === "undefined") return;
  const element = diagramRef.value;
  if (!element) return;

  await nextTick();

  try {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize({
      startOnLoad: false,
      theme: theme.value,
    });

    element.removeAttribute("data-processed");
    await mermaid.run({
      nodes: [element],
    });

    setTimeout(() => {
      if (element) {
        const height = element.offsetHeight;
        if (height > 0) {
          fixedHeight.value = `${height}px`;
        }
      }
    }, 100);
  } catch (error) {
    console.error("Mermaid rendering error:", error);
  }
}

onMounted(() => {
  renderDiagram();
});

watch(theme, () => {
  renderDiagram();
});
</script>

<style scoped>
.mermaid {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
  opacity: 0;
  transition: opacity 300ms ease;
}

.mermaid:has(> svg) {
  opacity: 1;
}
</style>
