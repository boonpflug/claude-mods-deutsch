export type Pending = string | null

declare module 'claude-code' {
  interface PluginState {
    'regel-merken': { pending: Pending; saving: boolean }
  }
}
