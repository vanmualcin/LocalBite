<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import type { RecipeCardView, RecipeStep } from '../types'

interface TimerState {
  remainingSeconds: number
  running: boolean
  intervalId?: number
}

const props = defineProps<{
  recipe: RecipeCardView | null
  show: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const completedStepIds = ref<string[]>([])
const timers = reactive<Record<string, TimerState>>({})
const visibleSections = computed(() => props.recipe?.sections.filter((section) => section.steps.length > 0) ?? [])

watch(
  () => [props.show, props.recipe?.id],
  () => {
    resetCookingState()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearTimers()
})

function resetCookingState(): void {
  clearTimers()
  completedStepIds.value = []

  if (!props.show || !props.recipe) {
    return
  }

  for (const section of props.recipe.sections) {
    for (const step of section.steps) {
      if (step.timerSeconds) {
        timers[step.id] = {
          remainingSeconds: step.timerSeconds,
          running: false,
        }
      }
    }
  }
}

function clearTimers(): void {
  for (const timer of Object.values(timers)) {
    if (timer.intervalId) {
      window.clearInterval(timer.intervalId)
    }
  }

  for (const timerId of Object.keys(timers)) {
    delete timers[timerId]
  }
}

function isCompleted(stepId: string): boolean {
  return completedStepIds.value.includes(stepId)
}

function toggleStep(stepId: string): void {
  if (isCompleted(stepId)) {
    completedStepIds.value = completedStepIds.value.filter((completedStepId) => completedStepId !== stepId)
    return
  }

  completedStepIds.value = [...completedStepIds.value, stepId]
}

function startTimer(step: RecipeStep): void {
  const timer = timers[step.id]

  if (!timer || timer.running || timer.remainingSeconds <= 0) {
    return
  }

  timer.running = true
  timer.intervalId = window.setInterval(() => {
    timer.remainingSeconds = Math.max(0, timer.remainingSeconds - 1)

    if (timer.remainingSeconds === 0) {
      pauseTimer(step)
    }
  }, 1000)
}

function pauseTimer(step: RecipeStep): void {
  const timer = timers[step.id]

  if (!timer) {
    return
  }

  if (timer.intervalId) {
    window.clearInterval(timer.intervalId)
  }

  timer.intervalId = undefined
  timer.running = false
}

function resetTimer(step: RecipeStep): void {
  const timer = timers[step.id]

  if (!timer || !step.timerSeconds) {
    return
  }

  pauseTimer(step)
  timer.remainingSeconds = step.timerSeconds
}

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const days = Math.floor(safeSeconds / 86400)
  const hours = Math.floor((safeSeconds % 86400) / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  return [days, hours, minutes, remainingSeconds].map(padTimer).join(':')
}

function padTimer(value: number): string {
  return value.toString().padStart(2, '0')
}
</script>

<template>
  <div v-if="show" class="cooking-backdrop"></div>
  <section v-if="show && recipe" class="cooking-mode" role="dialog" aria-modal="true" aria-labelledby="cooking-mode-title">
    <header class="cooking-header border-bottom">
      <div>
        <h2 id="cooking-mode-title" class="mb-1">Cooking Mode</h2>
        <p class="mb-0 text-secondary">{{ recipe.name }}</p>
      </div>
      <button class="btn btn-outline-secondary d-inline-flex align-items-center gap-2" type="button" @click="emit('close')">
        <span class="material-icons" aria-hidden="true">close</span>
        <span>Exit Cooking Mode</span>
      </button>
    </header>

    <div class="cooking-body">
      <div v-if="visibleSections.length > 0" class="cooking-section-stack">
        <section v-for="section in visibleSections" :key="section.id" class="cooking-section">
          <h3>{{ section.title }}</h3>

          <div class="cooking-step-list">
            <article v-for="step in section.steps" :key="step.id" class="cooking-step border" :class="{ 'is-complete': isCompleted(step.id) }">
              <label class="step-check">
                <input class="form-check-input" type="checkbox" :checked="isCompleted(step.id)" @change="toggleStep(step.id)" />
                <span>{{ step.text }}</span>
              </label>

              <div v-if="timers[step.id]" class="step-timer">
                <span class="timer-readout">{{ formatTimer(timers[step.id].remainingSeconds) }}</span>
                <div class="timer-controls">
                  <button class="btn btn-sm btn-outline-success" type="button" :disabled="timers[step.id].running || timers[step.id].remainingSeconds === 0" @click="startTimer(step)">
                    Start
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" type="button" :disabled="!timers[step.id].running" @click="pauseTimer(step)">
                    Pause
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" type="button" @click="resetTimer(step)">
                    Reset
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>

      <div v-else class="empty-cooking-state bg-white border">
        <span class="material-icons" aria-hidden="true">restaurant</span>
        <h3>No cooking steps yet</h3>
        <p class="text-secondary mb-0">Add instruction steps to use cooking mode for this recipe.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cooking-backdrop {
  background: color-mix(in srgb, var(--hc-text) 48%, transparent);
  inset: 0;
  position: fixed;
  z-index: 1190;
}

.cooking-mode {
  background: var(--hc-bg);
  border-radius: 8px;
  box-shadow: 0 20px 56px var(--hc-shadow);
  display: flex;
  flex-direction: column;
  inset: 12px;
  max-width: 1040px;
  overflow: hidden;
  position: fixed;
  z-index: 1200;
}

.cooking-header {
  align-items: flex-start;
  background: linear-gradient(135deg, var(--hc-topbar-start) 0%, var(--hc-surface) 48%, var(--hc-topbar-end) 100%);
  display: flex;
  flex: 0 0 auto;
  gap: 12px;
  justify-content: space-between;
  padding: 16px;
}

.cooking-header h2 {
  color: var(--hc-text);
  font-size: 1.35rem;
  font-weight: 850;
}

.cooking-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.cooking-section-stack {
  display: grid;
  gap: 20px;
}

.cooking-section h3 {
  color: var(--hc-text);
  font-size: 1.1rem;
  font-weight: 850;
  margin: 0 0 10px;
}

.cooking-step-list {
  display: grid;
  gap: 10px;
}

.cooking-step {
  background: var(--hc-surface);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  padding: 14px;
}

.cooking-step.is-complete {
  background: var(--hc-section);
  color: var(--hc-muted);
}

.cooking-step.is-complete .step-check span {
  text-decoration: line-through;
}

.step-check {
  align-items: flex-start;
  cursor: pointer;
  display: flex;
  gap: 12px;
  line-height: 1.45;
}

.step-check .form-check-input {
  flex: 0 0 auto;
  margin-top: 0.2rem;
}

.step-timer {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-left: 28px;
}

.timer-readout {
  color: var(--hc-warm);
  font-variant-numeric: tabular-nums;
  font-weight: 850;
  min-width: 58px;
}

.timer-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.empty-cooking-state {
  align-items: center;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  min-height: 280px;
  padding: 24px;
  text-align: center;
}

.empty-cooking-state .material-icons {
  color: var(--hc-text-soft);
  font-size: 44px;
}

.btn .material-icons {
  font-size: 18px;
}

@media (min-width: 768px) {
  .cooking-mode {
    inset: 24px;
    margin: 0 auto;
  }

  .cooking-header {
    align-items: center;
    padding: 20px 24px;
  }

  .cooking-body {
    padding: 24px;
  }

  .cooking-step {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .step-timer {
    justify-content: flex-end;
    padding-left: 0;
  }
}
</style>
