<script setup lang="ts">
const emit = defineEmits<{
  (event: 'toggle-menu'): void
}>()

const brandIconUrl = `${import.meta.env.BASE_URL}icons/localbite-page-logo-master.svg`
</script>

<template>
  <header class="topbar border-bottom">
    <div class="container-fluid d-flex align-items-center justify-content-between gap-3 px-3 px-lg-4">
      <div class="brand-lockup d-flex align-items-center gap-2">
        <span class="brand-logo-frame" aria-hidden="true">
          <img class="brand-mark" :src="brandIconUrl" alt="" />
        </span>
        <h1 class="brand-title mb-0">
          <span>LocalBite</span>
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
  --topbar-height: 72px;
  align-items: center;
  background: linear-gradient(135deg, #fff8e6 0%, #ead3a5 45%, #d7b16f 100%);
  border-bottom-color: rgba(118, 83, 43, 0.34) !important;
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.5),
    inset 0 -1px rgba(118, 83, 43, 0.18),
    0 5px 18px rgba(72, 54, 31, 0.12);
  color: #2a432a;
  display: flex;
  height: var(--topbar-height);
  position: sticky;
  top: 0;
  z-index: 1040;
}

.topbar::before {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.28), transparent 42%, rgba(72, 96, 52, 0.08));
  content: "";
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.topbar > .container-fluid {
  min-height: var(--topbar-height);
  position: relative;
  z-index: 1;
}

.brand-logo-frame {
  align-items: center;
  background: #fff8e6;
  border: 2px solid rgba(42, 67, 42, 0.7);
  border-radius: 10px;
  box-shadow:
    0 2px 7px rgba(63, 35, 15, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
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
  filter: drop-shadow(0 3px 5px rgba(42, 67, 42, 0.2));
  line-height: 0.9;
  min-width: 0;
}

.brand-title span {
  background: linear-gradient(180deg, #1e321e 0%, #456034 54%, #233c24 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 1.65rem;
  font-weight: 900;
  letter-spacing: 0;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.35);
  white-space: nowrap;
}

.icon-button {
  align-items: center;
  color: #2a432a;
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
