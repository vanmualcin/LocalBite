<script setup lang="ts">
const emit = defineEmits<{
  (event: 'toggle-menu'): void
}>()

const brandIconUrl = `${import.meta.env.BASE_URL}icons/hungry-codex-page-logo-master.svg`
</script>

<template>
  <header class="topbar border-bottom">
    <div class="container-fluid d-flex align-items-center justify-content-between gap-3 px-3 px-lg-4">
      <div class="brand-lockup d-flex align-items-center gap-2">
        <span class="brand-logo-frame" aria-hidden="true">
          <img class="brand-mark" :src="brandIconUrl" alt="" />
        </span>
        <h1 class="brand-title mb-0">
          <span>Hungry Codex</span>
        </h1>
      </div>

      <button
        class="btn btn-link icon-button d-lg-none"
        type="button"
        aria-label="Open categories"
        @click="emit('toggle-menu')"
      >
        <span class="material-icons" aria-hidden="true">menu</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  --topbar-height: var(--hc-topbar-content-height);
  align-items: stretch;
  background: var(--hc-topbar-safe);
  border-bottom-color: var(--hc-border) !important;
  box-shadow: 0 1px 4px var(--hc-shadow-soft);
  color: var(--hc-text);
  display: flex;
  min-height: var(--hc-topbar-total-height);
  padding-top: var(--hc-safe-area-top);
  position: sticky;
  top: 0;
  z-index: 1040;
}

.topbar > .container-fluid {
  min-height: var(--topbar-height);
  position: relative;
  z-index: 1;
}

.brand-logo-frame {
  align-items: center;
  background: var(--hc-surface);
  border: 1px solid var(--hc-border-strong);
  border-radius: 10px;
  box-shadow: 0 1px 4px var(--hc-shadow-soft);
  display: inline-flex;
  flex: 0 0 auto;
  height: 52px;
  justify-content: center;
  width: 52px;
}

.brand-mark {
  display: block;
  height: 47px;
  object-fit: contain;
  width: 47px;
}

.brand-lockup {
  min-width: 0;
}

.brand-title {
  display: inline-flex;
  line-height: 0.9;
  min-width: 0;
}

.brand-title span {
  background: linear-gradient(180deg, var(--hc-text) 0%, var(--hc-accent) 70%, var(--hc-text-soft) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0;
  white-space: nowrap;
}

.icon-button {
  align-items: center;
  color: var(--hc-text);
  display: inline-flex;
  height: 40px;
  justify-content: center;
  padding: 0;
  text-decoration: none;
  width: 40px;
}

.btn .material-icons {
  font-size: 20px;
}

@media (min-width: 576px) {
  .brand-title span {
    font-size: 2.25rem;
  }
}
</style>
