import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

const pending = atom({ plugin: 'regel-merken', key: 'pending' } as const, null)
const saving = atom({ plugin: 'regel-merken', key: 'saving' } as const, false)

const FEEDBACK =
  /^(nein|no|nee)\b|sieht nicht (gut|schön) aus|gefällt mir nicht|lieber so|mach (das|es) lieber|ich will (lieber|nicht|kein)|bitte (nie|immer)|nicht so\b|i wish we/i

async function save($: EngineInterface, feedback: string) {
  await update($, saving, () => true)
  const reply = await $.model.complete({
    model: 'haiku',
    maxTokens: 120,
    system: 'Du formulierst Feedback eines Nutzers als eine kurze, allgemeingültige Regel für einen Coding-Agenten. Deutsch, Imperativ, ein Satz, ohne Einleitung.',
    prompt: `Feedback: ${feedback}`,
  })
  const rule = reply.isAnswered ? reply.text.trim().replace(/^[-•]\s*/, '') : feedback

  const file = 'CLAUDE.md'
  const before = (await $.fs.exists(file)) ? await $.fs.read(file) : ''
  const heading = '## Regeln aus Feedback'
  const text = before.includes(heading)
    ? `${before.trimEnd()}\n- ${rule}\n`
    : `${before.trimEnd()}${before ? '\n\n' : ''}${heading}\n\n- ${rule}\n`
  await $.fs.write(file, text)

  await update($, pending, () => null)
  await update($, saving, () => false)
  $.ui.toast(`📌 Regel gespeichert: ${rule}`, { timeoutMs: 6000 })
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    const typed = e.origin === undefined || e.origin.kind === 'composer'
    if (!e.command && !e.isMeta && typed && FEEDBACK.test(e.text.trim())) {
      await update($, pending, () => e.text.trim())
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const feedback = await read($, pending)
    if (feedback === null || e.props.hasSurvey) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const short = feedback.length > 70 ? `${feedback.slice(0, 67)}…` : feedback

    return (
      <Box flexDirection="row" gap={1}>
        <Text color="magenta" bold>📌 Als feste Regel in CLAUDE.md speichern?</Text>
        <Text dimColor>„{short}“</Text>
        {(await read($, saving)) ? (
          <Text color="yellow">speichere …</Text>
        ) : (
          <Box flexDirection="row" gap={1}>
            <Button key="save" label="1 Speichern" hotkey="1" onPress={() => save($, feedback)} />
            <Button key="skip" label="2 Nein danke" hotkey="2" onPress={() => update($, pending, () => null)} />
          </Box>
        )}
      </Box>
    )
  })
}
