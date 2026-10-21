import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Step } from '../types'

const PANE = 'replay'
const steps = atom({ plugin: 'replay', key: 'steps' } as const, [])
const current = atom({ plugin: 'replay', key: 'current' } as const, [])
const at = atom({ plugin: 'replay', key: 'at' } as const, 0)

const lines = (s: string) => (s === '' ? [] : s.split('\n'))

async function relative($: EngineInterface, path: string) {
  const cwd = await $.session.cwd()
  return path.startsWith(cwd + '/') ? path.slice(cwd.length + 1) : path
}

async function record($: EngineInterface, step: Step) {
  await update($, current, list => [...list, step])
}

// spielt die Änderungen automatisch ab, eine alle 2,5 Sekunden
async function play($: EngineInterface) {
  const total = (await read($, steps)).length
  for (let i = 1; i < total; i++) {
    await $.clock.sleep(2500)
    await update($, at, () => i)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'replay', description: 'Änderungen des letzten Durchgangs abspielen' })
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await update($, current, () => [])
    return next(e)
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)
    if (!ran.isError) {
      await record($, { file: await relative($, e.file_path), removed: lines(e.old_string), added: lines(e.new_string) })
    }
    return ran
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    if (!ran.isError) {
      await record($, { file: await relative($, e.file_path), removed: [], added: lines(e.content).slice(0, 12) })
    }
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const list = await read($, current)
    if (list.length > 0) {
      await update($, steps, () => list)
      await update($, at, () => 0)
      $.ui.toast(`🎬 ${list.length} Änderungen · /replay zum Abspielen`, { timeoutMs: 6000 })
    }
    return done
  })

  on('command.run', { command: 'replay' }, async $ => {
    await update($, at, () => 0)
    await $.ui.open({ id: PANE, title: 'Replay' })
    void play($)
    return { text: 'Replay läuft.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const list = await read($, steps)
    if (list.length === 0) return <Text dimColor>Noch keine Änderungen aufgezeichnet.</Text>

    const i = Math.min(await read($, at), list.length - 1)
    const step = list[i]!
    const files = new Set(list.map(s => s.file)).size

    return (
      <Box flexDirection="column">
        <Text bold>🎬 Änderung {i + 1} von {list.length} · {files} Dateien</Text>
        <Text color="cyan">{step.file}</Text>
        <Text> </Text>
        {step.removed.slice(0, 10).map(l => <Text color="red">- {l}</Text>)}
        {step.added.slice(0, 10).map(l => <Text color="green">+ {l}</Text>)}
        <Text> </Text>
        <Box flexDirection="row" gap={1}>
          <Button key="prev" label="1 ◀ Zurück" hotkey="1" onPress={() => update($, at, n => Math.max(0, n - 1))} />
          <Button key="next" label="2 Weiter ▶" hotkey="2" onPress={() => update($, at, n => Math.min(list.length - 1, n + 1))} />
        </Box>
      </Box>
    )
  })
}
