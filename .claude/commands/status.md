# /status — Project Status Dashboard

Przeczytaj plik `project_context/status_board.md` i wygeneruj raport statusu projektu.

## Format raportu

```
╔══════════════════════════════════════════════════════╗
║  STATUS: [PROJECT_NAME]  —  [DATA]                   ║
╠══════════════════════════════════════════════════════╣
║  FAZY                                                ║
║  [x] Phase 1 — Discovery ✓                           ║
║  [x] Phase 2 — Product Definition ✓                  ║
║  [~] Phase 3 — UX & Design  ← IN PROGRESS            ║
║  [ ] Phase 4A — Tech Foundation                      ║
║  [ ] Phase 4B — Development                          ║
║  [ ] Phase 5A — Test Planning                        ║
║  [ ] Phase 5B — Code Audit                           ║
║  [ ] Phase 6 — DevOps & Deploy                       ║
║  [ ] Phase 7 — Launch & Scale                        ║
╠══════════════════════════════════════════════════════╣
║  OSTATNIA AKTYWNOŚĆ                                  ║
║  Agent: [z status_board.md]                          ║
║  Data:  [z status_board.md]                          ║
║  Co:    [z status_board.md]                          ║
╠══════════════════════════════════════════════════════╣
║  AGENT 4B LOOP (jeśli aktywny)                       ║
║  [x] Story #1 — Auth ✓                               ║
║  [x] Story #2 — Dashboard ✓                          ║
║  [~] Story #3 — Reports ← IN PROGRESS                ║
║  [ ] Story #4 — Settings                             ║
╠══════════════════════════════════════════════════════╣
║  AKTYWNE BLOKERY                                     ║
║  [z status_board.md — jeśli są]                      ║
╠══════════════════════════════════════════════════════╣
║  NASTĘPNA AKCJA                                      ║
║  → Uruchom: /agent[N]-[name]                         ║
╚══════════════════════════════════════════════════════╝
```

Jeśli `status_board.md` nie istnieje: wyświetl "Brak aktywnego projektu. Uruchom /new-saas-project aby zacząć."
