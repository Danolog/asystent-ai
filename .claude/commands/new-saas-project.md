# New SaaS Project — Orchestrator

Inicjalizujesz nowy projekt SaaS z Universal Agent System.

## Twoje zadanie

1. Zapytaj użytkownika o podstawowe informacje:
   - Nazwa projektu
   - Problem który rozwiązuje (1–2 zdania)
   - Target user (kto to będzie używał)
   - Business constraints: budżet, timeline, wielkość zespołu
   - Tech preferences (jeśli ma)

2. Utwórz plik `project_context/core.md` wypełniając go zebranymi informacjami (użyj template z `saas-agents/_shared/project_context/core.md`)

3. Utwórz plik `project_context/status_board.md` (użyj template z `saas-agents/_shared/project_context/status_board.md`) — zastąp `[PROJECT_NAME]` nazwą projektu, wszystkie fazy jako niezaznaczone

4. Utwórz puste pliki:
   - `project_context/assumptions_log.md`
   - `project_context/decisions_log.md`

5. Wyświetl menu nawigacyjne poniżej

---

## Menu nawigacyjne (wyświetl po inicjalizacji)

```
╔══════════════════════════════════════════════════════╗
║       UNIVERSAL SAAS AGENT SYSTEM — [PROJECT_NAME]   ║
╠══════════════════════════════════════════════════════╣
║  FAZY PROJEKTU                                       ║
║                                                      ║
║  Phase 1: /agent1-discovery                          ║
║    → Pomysł, rynek, walidacja, model biznesowy       ║
║                                                      ║
║  Phase 2: /agent2-product                            ║
║    → Charter, wymagania, User Stories, NFR           ║
║                                                      ║
║  Phase 3: /agent3-ux                                 ║
║    → Persony, User Flows, wireframes, design system  ║
║                                                      ║
║  Phase 4A: /agent4a-tech                             ║
║    → Stack, architektura, Interface Contracts        ║
║                                                      ║
║  Phase 4B: /agent4b-dev      ┐                       ║
║    → Implementacja (TDD loop)│ można równolegle      ║
║  Phase 5A: /agent5a-test     ┘                       ║
║    → Planowanie testów E2E                           ║
║                                                      ║
║  Phase 5B: /agent5b-code-audit                       ║
║    → E2E + security + observability                  ║
║                                                      ║
║  Phase 6: /agent6-devops                             ║
║    → CI/CD, infrastruktura, monitoring               ║
║                                                      ║
║  Phase 7: /agent7-launch                             ║
║    → Dokumentacja, GTM, post-launch                  ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║  NARZĘDZIA                                           ║
║  /status → gdzie jesteś, co dalej                    ║
╚══════════════════════════════════════════════════════╝
```

---

## Zasady systemu (przeczytaj raz, zapamiętaj na całą sesję)

### Zasada 1: Human-in-the-Loop
Żaden agent nie przeskakuje do następnego automatycznie. Każdy agent kończy się komunikatem HIL Gate — to Ty decydujesz co uruchomić.

### Zasada 2: Interface Contracts jako lingua franca
Agenty techniczne (4B, 5B, 6) komunikują się przez pliki:
- `_shared/interface_contracts/openapi.yaml`
- `_shared/interface_contracts/db_schema.sql`
- `_shared/interface_contracts/typescript_types.ts`
NIE przez przekazywanie sobie kodu źródłowego.

### Zasada 3: Summaries zamiast pełnych dokumentów
Agent 7 (i każdy agent) czyta `*_summary.md` poprzednich agentów — nie pełne pliki. Trzyma to kontekst okna czysty.

### Zasada 4: RAG dla kodu
Agenty techniczne (4B, 5B) używają `search_files` i `read_file` zamiast ładowania całego projektu. Zawsze moduł po module.

### Zasada 5: Green Build przed przejściem dalej
Agent 4B nie przechodzi do następnej story bez GREEN BUILD w terminalu. Żadnych wyjątków.

### Zasada 6: core.md jest STRICTLY_CONTROLLED
Tylko Agent 1 modyfikuje `core.md`. Każda zmiana = wpis w `decisions_log.md` z flagą PIVOT.
