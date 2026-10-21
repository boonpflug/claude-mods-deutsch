export type FileState = 'gelesen' | 'läuft' | 'geändert'
export type Touched = { path: string; state: FileState }

declare module 'claude-code' {
  interface PluginState {
    dateibaum: { files: Touched[] }
  }
}
