# Claude-Code-Mods auf Deutsch

8 Mods für Claude Code, komplett auf Deutsch: Banner, Abfragen, Panels und Hinweise erscheinen in deiner Sprache. Jeder Mod ist eine kleine Datei, die du lesen und anpassen kannst.

| Mod | Was er macht |
|---|---|
| `fortschritt` | Zeigt über dem Prompt live, wie lange Claude arbeitet, wie viele Tool-Calls es gab und was jeder Helfer-Agent gerade tut |
| `deutscher-skin` | Tool-Aufrufe mit deutschen Verben („liest“, „ändert“, „führt aus“), Icons und eigenen Farben |
| `merk-dir-das` | Ein kleiner Zweit-Agent liest lange Antworten mit und hebt Wichtiges als „💡 GUT ZU WISSEN“ hervor |
| `dateibaum` | Panel neben dem Chat: welche Dateien Claude liest und ändert (öffnen mit `/dateibaum`) |
| `cache-waechter` | Warnt nach langer Pause, bevor eine Nachricht bei kaltem Cache das ganze Gespräch neu einliest; `/keep-warm` hält ihn warm |
| `sprengradius` | Stoppt Lösch-Befehle wie `rm -rf` und zeigt vorher jede betroffene Datei |
| `regel-merken` | Macht aus deinem Feedback per Klick eine feste Regel in deiner CLAUDE.md |
| `replay` | Spielt nach einem Durchgang jede Datei-Änderung Schritt für Schritt ab (`/replay`) |

## Installieren

Du brauchst eine aktuelle Version von Claude Code (getestet mit 2.1.306). Tippe im Terminal in Claude Code, zum Beispiel für den Sprengradius:

```
/plugin install sprengradius --marketplace boonpflug/claude-mods-deutsch
```

Beim ersten Mal fragt Claude Code, ob es den Marketplace hinzufügen soll: mit `y` bestätigen und danach mit Enter den Bereich „user“ wählen. Der Mod läuft sofort, auch in allen neuen Sessions. Für die anderen Mods tauschst du einfach den Namen aus.

Aus der Shell geht es auch:

```
claude plugin install sprengradius --marketplace boonpflug/claude-mods-deutsch
```

In der Desktop-App: Plus neben dem Eingabefeld, dann Plugins, „Add marketplace“ mit `boonpflug/claude-mods-deutsch`, dann „Add plugin“.

## Einstellungen

- `cache-waechter`: Die Warnschwelle liegt bei 60 Minuten Pause. Mit der Umgebungsvariable `CACHE_WAECHTER_MINUTEN` stellst du sie anders ein.
- `merk-dir-das` und `regel-merken` rufen für ihre Hinweise kurz Haiku auf. Das kostet ein paar zusätzliche Tokens.

## Gut zu wissen

Ein Mod läuft mit denselben Rechten wie Claude Code. Lies ihn vor der Installation einmal durch oder lass Claude erklären, was er tut. Das gilt für diese Mods genauso wie für jeden anderen.

Lizenz: MIT
