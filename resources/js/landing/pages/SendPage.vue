<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SendWidget from '../components/tools/SendWidget.vue';
import ToolPage from '../components/tools/ToolPage.vue';

const { i18n } = useI18n();
const data = computed(() => i18n.content.pages.send);
const step = ref(0);
</script>

<template>
  <ToolPage page="send" :data="data" :step="step">
    <SendWidget :data="data.widget" :common="i18n.content.common" @step="step = $event" />
  </ToolPage>
</template>
