import type { Register } from 'claude-code'

// Palette: Terrakotta, Creme, Espresso (einfach durch deine eigenen Farben ersetzen)
const ACCENT = '#c8643b'
const CREAM = '#f3e3cc'
const MUTED = '#9b8573'

const LOOK: Record<string, { icon: string; label: string }> = {
  Read: { icon: '📖', label: 'liest' },
  Edit: { icon: '✏️', label: 'ändert' },
  Write: { icon: '📝', label: 'schreibt' },
  Bash: { icon: '⚡', label: 'führt aus' },
  Grep: { icon: '🔍', label: 'sucht' },
  Glob: { icon: '🗂️', label: 'findet' },
  WebFetch: { icon: '🌐', label: 'lädt' },
}

function summary(input: unknown): string {
  if (typeof input !== 'object' || input === null) return ''
  const o = input as Record<string, unknown>
  const pick = o.file_path ?? o.command ?? o.pattern ?? o.url ?? o.path
  const text = typeof pick === 'string' ? pick : ''
  return text.length > 90 ? `${text.slice(0, 87)}…` : text
}

export const register: Register = on => {
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const look = LOOK[e.props.tool]
    if (!look || e.props.isExpanded) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const state = e.props.isErrored ? '✗' : e.props.isRunning ? '…' : '✓'
    const stateColor = e.props.isErrored ? 'red' : e.props.isRunning ? 'yellow' : 'green'

    return (
      <Box flexDirection="row" gap={1}>
        <Text>{look.icon}</Text>
        <Text color={ACCENT} bold>{look.label}</Text>
        <Text color={CREAM}>{summary(e.props.input)}</Text>
        <Text color={stateColor}>{state}</Text>
        <Text color={MUTED}>· {e.props.tool}</Text>
      </Box>
    )
  })
}
