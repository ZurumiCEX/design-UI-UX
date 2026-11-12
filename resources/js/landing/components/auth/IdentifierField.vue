<script setup>
import { computed, ref } from 'vue';
import ZSelect from '../ui/ZSelect.vue';

// Identifiant : onglets E-mail / Numéro mobile ; le numéro se saisit avec l'indicatif du pays.
const props = defineProps({
  data: { type: Object, required: true }, // auth.identifier
  countries: { type: Array, required: true },
  error: { type: String, default: '' }, // 'email' | 'phone' | ''
  idPrefix: { type: String, default: 'auth' },
});
const method = defineModel('method', { default: 'email' });
const email = defineModel('email', { default: '' });
const phone = defineModel('phone', { default: '' });
const country = defineModel('country', { default: 'SN' });

const emailInput = ref(null);
const phoneInput = ref(null);
const countryOptions = computed(() =>
  props.countries.map((c) => ({ value: c.id, label: c.name, short: c.dial, sub: c.dial, keywords: `${c.dial} ${c.id}` })),
);
const errorText = computed(() => (props.error ? props.data.errors[props.error] : ''));
const errorId = `${props.idPrefix}-id-error`;

function focus() {
  (method.value === 'email' ? emailInput : phoneInput).value?.focus();
}
function onTabKey(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    method.value = method.value === 'email' ? 'phone' : 'email';
    e.currentTarget.parentElement.querySelector('[aria-selected="true"]')?.focus();
  }
}
defineExpose({ focus });
</script>

<template>
  <div class="idf">
    <div class="z-tabs idf__tabs" role="tablist" :aria-label="data.label" @keydown="onTabKey">
      <button
        v-for="m in ['email', 'phone']"
        :id="`${idPrefix}-tab-${m}`"
        :key="m"
        type="button"
        role="tab"
        class="z-tab"
        :aria-selected="method === m"
        :aria-controls="`${idPrefix}-panel`"
        :tabindex="method === m ? 0 : -1"
        @click="method = m"
      >
        {{ data.tabs[m] }}
      </button>
    </div>

    <div :id="`${idPrefix}-panel`" role="tabpanel" :aria-labelledby="`${idPrefix}-tab-${method}`" class="idf__panel">
      <template v-if="method === 'email'">
        <label class="z-label" :for="`${idPrefix}-email`">{{ data.email }}</label>
        <input
          :id="`${idPrefix}-email`"
          ref="emailInput"
          v-model="email"
          class="z-input"
          type="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          :placeholder="data.emailPlaceholder"
          :aria-invalid="error === 'email'"
          :aria-describedby="error ? errorId : undefined"
        />
      </template>
      <template v-else>
        <label class="z-label" :for="`${idPrefix}-phone`">{{ data.phone }}</label>
        <div class="idf__phone">
          <ZSelect v-model="country" variant="field" class="idf__country" :options="countryOptions" :label="data.country" searchable :search-label="data.countrySearch" />
          <input
            :id="`${idPrefix}-phone`"
            ref="phoneInput"
            v-model="phone"
            class="z-input"
            type="tel"
            name="phone"
            autocomplete="tel-national"
            inputmode="numeric"
            :placeholder="data.phonePlaceholder"
            :aria-invalid="error === 'phone'"
            :aria-describedby="error ? errorId : undefined"
          />
        </div>
      </template>
      <p v-if="errorText" :id="errorId" class="z-error">{{ errorText }}</p>
    </div>
  </div>
</template>

<style scoped>
.idf__tabs { margin-bottom: 22px; }
.idf__phone { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 8px; }
</style>
