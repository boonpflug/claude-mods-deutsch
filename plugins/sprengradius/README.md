# Sprengradius

Ein Claude-Code-Mod, der riskante Lösch-Befehle abfängt, bevor sie laufen. Sobald Claude `rm -r`, `rm -rf`, `rmdir` oder `find … -delete` ausführen will, listet der Mod alle Dateien auf, die betroffen wären, und fragt dich, ob du wirklich löschen willst. Erst nach deinem Klick auf „Ja, löschen“ läuft der Befehl. Sonst wird er gestoppt und Claude bekommt die Info, dass du abgelehnt hast.

## Installieren

Im Terminal in Claude Code eintippen:

```
/plugin install sprengradius --marketplace boonpflug/claude-mods-deutsch
```

Danach `y` zum Hinzufügen des Marketplace und mit Enter den Bereich „user“ wählen. Der Mod läuft sofort.

Aus der Shell geht es auch: `claude plugin install sprengradius --marketplace boonpflug/claude-mods-deutsch`
