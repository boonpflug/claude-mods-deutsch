import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { FileState, Touched } from '../types'

const PANE = 'dateibaum'
const files = atom({ plugin: 'dateibaum', key: 'files' } as const, [])

const ICON: Record<FileState, string> = { gelesen: '👀', läuft: '✏️ ', geändert: '✅' }
const COLOR: Record<FileState, string> = { gelesen: 'gray', läuft: 'yellow', geändert: 'green' }

async function mark($: EngineInterface, absolute: string, state: FileState) {
  const cwd = await $.session.cwd()
  const path = absolute.startsWith(cwd + '/') ? absolute.slice(cwd.length + 1) : absolute
  await update($, files, list => {
    const known = list.find(f => f.path === path)
    // eine bereits geänderte Datei bleibt grün, auch wenn Claude sie danach nur liest
    if (known && known.state === 'geändert' && state === 'gelesen') return list
    const next: Touched = { path, state }
    return known ? list.map(f => (f.path === path ? next : f)) : [...list, next]
  })
}

const SKIP = new Set(['.git', 'node_modules', '.claude', 'dist', 'build'])

// Änderungszeiten aller Projektdateien, damit auch Änderungen per Shell-Befehl auffallen
async function snapshot($: EngineInterface, dir: string, out: Map<string, number>, budget = { left: 2000 }) {
  for (const entry of await $.fs.list(dir)) {
    if (budget.left-- <= 0) return out
    const path = `${dir}/${entry.name}`
    if (entry.kind === 'dir' && !SKIP.has(entry.name)) await snapshot($, path, out, budget)
    if (entry.kind === 'file') out.set(path, entry.mtimeMs)
  }
  return out
}

// Dateien, die ein Lesebefehl wie `cat a b` oder `head -n 5 x` anfasst
async function readsOf($: EngineInterface, command: string): Promise<string[]> {
  const cwd = await $.session.cwd()
  const words = command
    .split(/&&|;|\||\n/)
    .filter(part => /^\s*(cat|head|tail|less|wc|sed\s+-n)\b/.test(part))
    .flatMap(part => part.trim().split(/\s+/).slice(1))
    .filter(word => !word.startsWith('-') && !/^['"]?\d/.test(word))
  const found: string[] = []
  for (const word of words) {
    const path = word.startsWith('/') ? word : `${cwd}/${word}`
    if ((await $.fs.exists(path)) && (await $.fs.stat(path)).kind === 'file') found.push(path)
  }
  return found
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'dateibaum', description: 'Datei-Panel öffnen' })
    void $.ui.open({ id: PANE, title: 'Dateibaum' })
    return next(e)
  })

  on('command.run', { command: 'dateibaum' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Dateibaum' })
    return { text: 'Dateibaum geöffnet.' }
  })

  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    await mark($, e.file_path, 'gelesen')
    return next(e)
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    await mark($, e.file_path, 'läuft')
    const ran = await next(e)
    await mark($, e.file_path, ran.isError ? 'gelesen' : 'geändert')
    return ran
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    await mark($, e.file_path, 'läuft')
    const ran = await next(e)
    await mark($, e.file_path, ran.isError ? 'gelesen' : 'geändert')
    return ran
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const cwd = await $.session.cwd()
    for (const path of await readsOf($, e.command)) await mark($, path, 'gelesen')
    const before = await snapshot($, cwd, new Map())
    const ran = await next(e)
    const after = await snapshot($, cwd, new Map())
    for (const [path, mtime] of after) {
      if (before.get(path) !== mtime) await mark($, path, 'geändert')
    }
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const list = [...(await read($, files))].sort((a, b) => a.path.localeCompare(b.path))
    const changed = list.filter(f => f.state === 'geändert').length

    return (
      <Box flexDirection="column">
        <Text bold>📁 {list.length} Dateien angefasst · {changed} geändert</Text>
        <Text> </Text>
        {list.length === 0 && <Text dimColor>Noch nichts angefasst.</Text>}
        {list.map(f => {
          const depth = f.path.split('/').length - 1
          const name = f.path.split('/').pop() ?? f.path
          const folder = depth > 0 ? f.path.slice(0, f.path.length - name.length) : ''
          return (
            <Text color={COLOR[f.state]} bold={f.state === 'läuft'}>
              {ICON[f.state]} <Text dimColor>{folder}</Text>{name}
            </Text>
          )
        })}
      </Box>
    )
  })
}
