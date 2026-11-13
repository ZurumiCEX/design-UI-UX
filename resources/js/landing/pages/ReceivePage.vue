<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import ReceiveWidget from '../components/tools/ReceiveWidget.vue';
import ToolPage from '../components/tools/ToolPage.vue';

const { i18n } = useI18n();
const data = computed(() => i18n.content.pages.receive);
const step = ref(0);
</script>

<template>
  <ToolPage page="receive" :data="data" :step="step">
    <ReceiveWidget :data="data.widget" :common="i18n.content.common" @step="step = $event" />
  </ToolPage>
</template>
