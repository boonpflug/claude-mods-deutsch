import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

const hint = atom({ plugin: 'merk-dir-das', key: 'hint' } as const, null)

const SYSTEM =
  'Du liest die Antwort eines Coding-Agenten mit. Gibt es darin etwas, das der Nutzer auf keinen Fall überlesen darf ' +
  '(Kosten, Risiken, Fristen, Sicherheitsthemen, etwas, das er selbst tun muss)? Wenn ja: genau ein kurzer deutscher Satz, ' +
  'konkret mit Zahl, falls vorhanden. Wenn nein: antworte exakt NICHTS.'

async function review($: EngineInterface) {
  const messages = await $.session.messages()
  const last = [...messages].reverse().find(m => m.role === 'assistant' && m.text.trim().length > 0)
  if (!last || last.text.length < 400) return

  const reply = await $.model.complete({ model: 'haiku', maxTokens: 120, system: SYSTEM, prompt: last.text.slice(-12_000) })
  if (!reply.isAnswered) return
  const text = reply.text.trim()
  if (text === '' || /^NICHTS\b/i.test(text)) return

  await update($, hint, () => text)
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    await update($, hint, () => null)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.reason === 'answer') void review($)
    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const text = await read($, hint)
    if (text === null || e.props.hasSurvey) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text backgroundColor="yellow" color="black" bold wrap="truncate"> 💡 GUT ZU WISSEN </Text>
          <Button key="ok" label="1 OK" hotkey="1" onPress={() => update($, hint, () => null)} />
        </Box>
        <Text color="yellow">{text}</Text>
      </Box>
    )
  })
}
