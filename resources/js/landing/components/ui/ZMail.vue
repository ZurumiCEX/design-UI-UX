<script setup>
import { computed } from 'vue';

// Adresse e-mail protégée contre les robots : affichée « nom[a]domaine », jamais écrite en clair
// dans le HTML ; le lien mailto n'est assemblé qu'au clic.
const props = defineProps({
  mail: { type: Object, required: true }, // { user, domain }
});
const shown = computed(() => `${props.mail.user}[a]${props.mail.domain}`);
function open() {
  window.location.href = `mailto:${props.mail.user}${String.fromCharCode(64)}${props.mail.domain}`;
}
</script>

<template>
  <a href="#" class="z-mail" @click.prevent="open"><slot />{{ shown }}</a>
</template>
