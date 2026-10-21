# cache-waechter

Ein Claude-Code-Mod, der den Prompt-Cache im Blick behält. Wenn du nach einer längeren Pause eine Nachricht schickst und der Cache vermutlich kalt ist, hält der Mod die Nachricht an und zeigt dir, wie viele Tokens dann neu gelesen werden müssten. Du entscheidest, ob du sie trotzdem sendest. Mit /keep-warm schickt der Mod kurz vor Ablauf eine Mini-Nachricht, damit der Cache warm bleibt.

## Installieren

Im Terminal in Claude Code eintippen:

```
/plugin install cache-waechter --marketplace boonpflug/claude-mods-deutsch
```

Danach `y` zum Hinzufügen des Marketplace und mit Enter den Bereich „user“ wählen. Der Mod läuft sofort.

Aus der Shell geht es auch: `claude plugin install cache-waechter --marketplace boonpflug/claude-mods-deutsch`
