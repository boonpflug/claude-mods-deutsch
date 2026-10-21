export type Step = { file: string; removed: string[]; added: string[] }

declare module 'claude-code' {
  interface PluginState {
    replay: { steps: Step[]; current: Step[]; at: number }
  }
}
