<template>
  <q-page padding class="video-grid">
    <VideoTile :key="LOCAL_SOCKET_ID" :id="LOCAL_SOCKET_ID" :stream="localStream" :muted="true">
    </VideoTile>
    <VideoTile v-for="c in connections" :key="c.id" :id="c.id" :stream="c.stream"> </VideoTile>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import VideoTile from 'components/VideoTile.vue';
import { LOCAL_SOCKET_ID, useAppStore } from 'src/stores/app-store';

const appStore = useAppStore();
const connections = computed(() => appStore.connections);
let localStream: MediaStream;

onMounted(async () => {
  await init();
});

onUnmounted(() => {
  appStore.disconnect();
});

async function init() {
  try {
    localStream = await appStore.setLocalStream();
    appStore.connect();
  } catch (error) {
    alert(String(error));
  }
}
</script>
