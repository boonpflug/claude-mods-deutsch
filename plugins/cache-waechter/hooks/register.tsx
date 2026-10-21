import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

const lastActive = atom({ plugin: 'cache-waechter', key: 'lastActive' } as const, 0)
const keepWarm = atom({ plugin: 'cache-waechter', key: 'keepWarm' } as const, false)

const PING = 'Kurzer Ping, damit der Cache warm bleibt. Antworte nur mit „ok“.'

async function coldAfterMs($: EngineInterface): Promise<number> {
  // Standard: etwa eine Stunde. Für Demos per CACHE_WAECHTER_MINUTEN verkürzbar.
  const minutes = Number((await $.env.get('CACHE_WAECHTER_MINUTEN')) ?? '60')
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : 60) * 60_000
}

async function warmLoop($: EngineInterface) {
  const limit = await coldAfterMs($)
  while (await read($, keepWarm)) {
    const idle = (await $.clock.now()) - (await read($, lastActive))
    const wait = Math.max(5_000, limit - idle - Math.min(60_000, limit / 6))
    await $.clock.sleep(wait)
    if (!(await read($, keepWarm))) return
    const stillIdle = (await $.clock.now()) - (await read($, lastActive))
    if (stillIdle >= limit - Math.min(60_000, limit / 6)) {
      $.ui.status('🔥 Cache wird warm gehalten')
      await $.prompt.submit({ text: PING })
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await update($, lastActive, () => 0)
    await $.command.register({
      name: 'keep-warm',
      description: 'Prompt-Cache warm halten, solange du weg bist (an/aus)',
    })
    return next(e)
  })

  on('command.run', { command: 'keep-warm' }, async $ => {
    const on_ = !(await read($, keepWarm))
    await update($, keepWarm, () => on_)
    $.ui.status(on_ ? '🔥 keep-warm an' : undefined)
    if (on_) void warmLoop($)
    return { text: on_ ? 'keep-warm ist an: Kurz bevor der Cache kalt wird, schicke ich einen Mini-Ping.' : 'keep-warm ist aus.' }
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const now = await $.clock.now()
    await update($, lastActive, () => now)
    return done
  })

  on('prompt.submit', async ($, e, next) => {
    const last = await read($, lastActive)
    const typed = e.origin === undefined || e.origin.kind === 'composer'
    if (e.command || e.isMeta || !typed || last === 0) return next(e)

    const idle = (await $.clock.now()) - last
    if (idle < (await coldAfterMs($))) return next(e)

    const usage = await $.session.usage()
    const tokens = usage.context.tokens ?? 0
    if (tokens < 1_000) return next(e)

    const minutes = Math.round(idle / 60_000)
    const answer = await $.ui.ask(
      `🧊 Cache ist kalt (letzte Antwort vor ${minutes} min).\n` +
        `Diese Nachricht liest das ganze Gespräch neu ein: ca. ${tokens.toLocaleString('de-DE')} Tokens ` +
        `(${usage.context.percent ?? '?'} % deines Kontexts).\n\nTrotzdem senden?`,
      { header: 'Cache-Wächter', options: ['Trotzdem senden', 'Lieber neu starten (/clear)'] },
    )

    if (answer === 'Trotzdem senden') return next(e)
    return { drop: 'Cache-Wächter: Nachricht nicht gesendet. Tipp: /clear und mit einer kurzen Zusammenfassung neu starten.' }
  }).catch(($, e, next) => next(e))
}
