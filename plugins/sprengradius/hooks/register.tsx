import type { EngineInterface, Register } from 'claude-code'

// rm -r / rm -rf / rm -fr …, rmdir, find … -delete
const RISKY = /\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*\s+)+|\brmdir\b|\bfind\b.*\s-delete\b/

const targetsOf = (command: string): string[] =>
  command
    .split(/&&|;|\|\|/)
    .filter(part => RISKY.test(part))
    .flatMap(part =>
      part
        .trim()
        .split(/\s+/)
        .slice(1)
        .filter(word => !word.startsWith('-') && word !== 'find' && word !== '-delete'),
    )

async function filesUnder($: EngineInterface, path: string): Promise<string[]> {
  if (!(await $.fs.exists(path))) return []
  const stat = await $.fs.stat(path)
  if (stat.kind !== 'dir') return [path]
  const entries = await $.fs.list(path)
  const nested = await Promise.all(
    entries.map(entry => filesUnder($, `${path.replace(/\/$/, '')}/${entry.name}`)),
  )
  return nested.flat()
}

export const register: Register = on => {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!RISKY.test(e.command)) return next(e)

    const found = await Promise.all(targetsOf(e.command).map(t => filesUnder($, t)))
    const files = [...new Set(found.flat())]
    if (files.length === 0) return next(e)

    const shown = files.slice(0, 12).map(f => `  • ${f}`).join('\n')
    const more = files.length > 12 ? `\n  … und ${files.length - 12} weitere` : ''
    const answer = await $.ui.ask(
      `💥 Sprengradius: Dieser Befehl löscht ${files.length} Dateien:\n${shown}${more}\n\nWirklich ausführen?`,
      { header: 'Sprengradius', options: ['Abbrechen', 'Ja, löschen'] },
    )

    return answer === 'Ja, löschen'
      ? next(e)
      : { deny: `Sprengradius: Löschen von ${files.length} Dateien wurde vom Nutzer gestoppt.` }
  }).catch(($, e, next) =>
    next.called ? next(e) : { deny: 'Sprengradius: Prüfung fehlgeschlagen, Löschen gestoppt.' },
  )
}
