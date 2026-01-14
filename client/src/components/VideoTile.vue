<template>
  <video
    :id="props.id"
    class="video-tile"
    ref="videoRef"
    playsinline
    autoplay
    controls
    :muted="props.muted"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  id: string;
  stream: MediaStream;
  muted?: boolean;
}

const props = withDefaults(defineProps<Props>(), { muted: false });

const videoRef = ref<HTMLVideoElement | null>(null);

onMounted(() => {
  if (videoRef.value && props.stream) videoRef.value.srcObject = props.stream;
});

onUnmounted(() => {
  if (videoRef.value) videoRef.value.srcObject = null;
});

watch(
  () => props.stream,
  (stream) => {
    if (videoRef.value) videoRef.value.srcObject = stream;
  },
);
</script>
