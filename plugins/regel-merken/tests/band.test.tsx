import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'regel-merken',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  props: { hasSurvey: false },
} as const

test('Feedback zeigt das Banner', async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await $.prompt.submit({ text: 'nein, sieht nicht gut aus. Bitte immer per Du.' })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface } as never)
    const t = await ui.find({ type: 'Text', text: /feste Regel/ })
    expect(t?.text).toContain('feste Regel')
    await ui.unmount()
  }
})
