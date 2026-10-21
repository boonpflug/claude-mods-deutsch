export type Helper = { id: string; task: string; model: string; isDone: boolean }
export type Run = { startedAt: number; now: number; tools: number; helpers: Helper[]; isRunning: boolean }

declare module 'claude-code' {
  interface PluginState {
    fortschritt: { run: Run | null }
  }
}
