import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Run } from '../types'

const run = atom({ plugin: 'fortschritt', key: 'run' } as const, null)

const CRABS = ['🦀', '🦞', '🐙', '🦑', '🐡']

function bar(done: number, total: number, width = 14) {
  const filled = total === 0 ? 0 : Math.round((done / total) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

async function tick($: EngineInterface) {
  while ((await read($, run))?.isRunning) {
    const now = await $.clock.now()
    await update($, run, r => (r ? { ...r, now } : r))
    await $.clock.sleep(1000)
  }
}

export const register: Register = on => {
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      const now = await $.clock.now()
      const r = await read($, run)
      // laufen noch Hintergrund-Helfer, gehört dieser Durchgang zum selben Lauf
      const waiting = r?.helpers.some(one => !one.isDone)
      await update($, run, prev =>
        waiting && prev ? { ...prev, isRunning: true } : { startedAt: now, now, tools: 0, helpers: [], isRunning: true },
      )
      if (!r?.isRunning) void tick($)
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) {
      await update($, run, r =>
        r ? { ...r, helpers: r.helpers.map(one => (one.id === e.agentId ? { ...one, isDone: true } : one)) } : r,
      )
    } else {
      await update($, run, r => (r ? { ...r, isRunning: r.helpers.some(one => !one.isDone) } : r))
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    await update($, run, r => (r ? { ...r, tools: r.tools + 1 } : r))
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny === undefined && started.agentId !== undefined) {
      const helper = { id: started.agentId, task: e.description, model: started.model.replace(/^claude-/, ''), isDone: false }
      await update($, run, r => (r ? { ...r, helpers: [...r.helpers, helper] } : r))
    }
    return started
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r: Run | null = await read($, run)
    if (!r || e.props.hasSurvey) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const done = r.helpers.filter(one => one.isDone).length

    return (
      <Box flexDirection="column">
        <Text>
          <Text color={r.isRunning ? 'yellow' : 'green'} bold>
            {r.isRunning ? (done < r.helpers.length && r.helpers.length > 0 ? '⏳ Helfer arbeiten' : '⏳ Claude arbeitet') : '✅ Fertig'}
          </Text>
          <Text dimColor> · {clock(r.now - r.startedAt)} · {r.tools} Tool-Calls</Text>
          {r.helpers.length > 0 && (
            <Text dimColor> · Helfer {done}/{r.helpers.length} </Text>
          )}
          {r.helpers.length > 0 && <Text color="cyan">{bar(done, r.helpers.length)}</Text>}
        </Text>
        {r.helpers.map((helper, i) => (
          <Text dimColor={helper.isDone}>
            {'  '}{CRABS[i % CRABS.length]} {helper.task} <Text dimColor>({helper.model})</Text>{' '}
            {helper.isDone ? <Text color="green">✓ fertig</Text> : <Text color="yellow">… arbeitet</Text>}
          </Text>
        ))}
      </Box>
    )
  })
}
