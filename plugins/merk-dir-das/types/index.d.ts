export type Hint = string | null

declare module 'claude-code' {
  interface PluginState {
    'merk-dir-das': { hint: Hint }
  }
}
