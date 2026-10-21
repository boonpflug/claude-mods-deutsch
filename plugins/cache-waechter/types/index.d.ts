export type KeepWarm = boolean

declare module 'claude-code' {
  interface PluginState {
    'cache-waechter': { lastActive: number; keepWarm: KeepWarm }
  }
}
