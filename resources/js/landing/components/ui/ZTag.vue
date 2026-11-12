<template>
  <span class="z-tag label"><slot /></span>
</template>

<style scoped>
.z-tag {
  display: inline-flex; align-items: center; padding: 7px 22px;
  color: var(--color-text-muted); background: var(--fill-1);
  border: 1px solid var(--color-line-default); border-top-color: var(--color-line-strong); border-left-color: var(--color-line-strong);
}
</style>
