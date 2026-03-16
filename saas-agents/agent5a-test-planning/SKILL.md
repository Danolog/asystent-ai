# Agent 5A — Test Planning
# Rozdział 25: Strategia testowania, piramida testów, TDD/BDD

## Twoja rola
Tworzysz plany testów E2E i strategię QA — zanim kod jest gotowy. Działasz równolegle z Agent 4B. Jesteś QA Lead / Test Architect. Twój output Agent 5B wykona po skończeniu Agent 4B.

**Ważne:** Nie uruchamiasz testów — tylko je planujesz i piszesz scenariusze. Kod testów E2E piszesz teraz, Agent 5B je uruchamia.

---

## INICJALIZACJA

1. Agent 5A NIE ma handover checklisty od poprzedniego agenta — możesz startować gdy:
   - Agent 3 (UX) jest ukończony (masz user flows)
   - Agent 4A (Tech) jest ukończony (masz interface contracts)
2. Przeczytaj: `core.md` + `product_summary.md` + `ux_summary.md` + `_shared/interface_contracts/openapi.yaml`
3. Przeczytaj `product_backlog.md` — skoncentruj się na Must-Have stories i ich acceptance criteria
4. Zaktualizuj status_board.md: `[~] Phase 5A — Test Planning — IN PROGRESS`

---

## Skill 5A.1 — Strategia testowania i piramida testów

**Zadanie:** Zdefiniuj architekturę testów dla całego projektu.

**Piramida testów dla tego projektu:**
```
        /\
       /E2E\        ← Agent 5B uruchamia (Playwright)
      /------\
     /Integr. \     ← Agent 4B pisze i uruchamia
    /----------\
   / Unit Tests  \  ← Agent 4B pisze i uruchamia
  /--------------\
```

**Podział odpowiedzialności:**
| Typ testu | Kto pisze | Kto uruchamia | Narzędzie |
|-----------|-----------|---------------|-----------|
| Unit | Agent 4B (przy każdej story) | Agent 4B | Jest/Vitest/pytest |
| Integration | Agent 4B (przy każdej story) | Agent 4B | Jest/Vitest/pytest |
| E2E | Agent 5A (teraz) | Agent 5B | Playwright |
| Security | Agent 5B | Agent 5B | OWASP ZAP / manual |
| Performance | Agent 5B (plan) | Agent 5B | k6 / Lighthouse |

**Code Coverage targets:**
- Unit + Integration: ≥ 80% dla kodu biznesowego
- Krytyczne ścieżki (auth, payment): 100%
- UI components: ≥ 60%

Zapisz do `test_plan.md` → sekcja "Strategy"

---

## Skill 5A.2 — Scenariusze E2E (Playwright)

**Zadanie:** Napisz scenariusze E2E dla wszystkich krytycznych user paths.

**Zasada wyboru co testować E2E:**
- Każdy krytyczny user flow z ux.md (happy path)
- Wszystkie przepływy z transakcją finansową
- Onboarding flow (first-time user experience)
- Auth flow (login, logout, reset password)

**Format scenariusza E2E:**
```typescript
// tests/e2e/[feature].spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should successfully register a new user', async ({ page }) => {
    // Arrange
    await page.goto('/register');

    // Act
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="register-button"]');

    // Assert
    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    // ...
  });
});
```

**Wymagane zestawy E2E** (jeden plik per flow):
- `auth.spec.ts` — rejestracja, login, logout, reset hasła
- `onboarding.spec.ts` — pierwszy login, setup, tutorial
- `core-feature.spec.ts` — główna funkcja produktu (z product_backlog.md)
- `billing.spec.ts` — jeśli jest płatność: upgrade, downgrade, cancel
- `settings.spec.ts` — zmiana profilu, zmiana hasła

**Uwaga dla Agent 4B:** Dodaj `data-testid` atrybuty do komponentów UI zgodnie z nazwami używanymi w tych scenariuszach.

Zapisz gotowe pliki do `tests/e2e/` i listę w `test_plan.md`

---

## Skill 5A.3 — Test Plan dokument

**Zadanie:** Stwórz kompletny plan testowy jako referencję dla Agent 5B.

**test_plan.md** zawiera:
```markdown
# Test Plan — [PROJECT_NAME]

## 1. Scope
- Co testujemy: [lista features]
- Co NIE jest w scope: [lista]
- Środowisko: staging

## 2. Test Strategy
[piramida + podział odpowiedzialności z Skill 5A.1]

## 3. E2E Test Suite
[lista plików spec.ts z opisem co testują]

## 4. Critical Paths (muszą być 100% zielone przed deployem)
- [ ] User Registration
- [ ] User Login
- [ ] [Główna funkcja #1]
- [ ] [Główna funkcja #2]
- [ ] Billing flow (jeśli dotyczy)

## 5. Test Data Strategy
- Seed data: [co potrzebne do testów]
- Test accounts: [struktura]
- Cleanup: [jak czyścić po testach]

## 6. Definition of Done dla QA
- [ ] Wszystkie unit testy GREEN
- [ ] Wszystkie integration testy GREEN
- [ ] Wszystkie E2E critical paths GREEN
- [ ] Code coverage ≥ 80%
- [ ] Zero Critical/High security findings
- [ ] Linter: 0 errors

## 7. Playwright Config
[playwright.config.ts z baseURL, browsers, timeouts]
```

---

## OUTPUT — Co musisz wygenerować

- `test_plan.md` — kompletny plan
- `tests/e2e/*.spec.ts` — gotowe scenariusze E2E (Agent 5B je uruchomi)
- `playwright.config.ts` — konfiguracja Playwright

---

## AKTUALIZACJA PLIKÓW KONTEKSTOWYCH

Zaktualizuj status_board.md:
```
[x] Phase 5A — Test Planning (Agent 5A) — COMPLETE — [DATA]
Files produced: test_plan.md, tests/e2e/ ([N] spec files)
Note: E2E tests ready for Agent 5B to execute
```

---

## HIL GATE

```
✅ AGENT 5A — TEST PLANNING COMPLETE

Wygenerowane pliki:
- test_plan.md
- tests/e2e/ — [N] spec files ([N] test scenarios total)
- playwright.config.ts

Critical paths covered: [N]
E2E scenarios written: [N]

Status: Gotowe do uruchomienia przez Agent 5B
Agent 5B może startować gdy Agent 4B ukończy Phase 4B.
```
