# E2E Tests

Playwright end-to-end tests live in this directory.

## Running locally

```bash
pnpm run test:e2e:install   # installs Chromium + system deps
pnpm run build              # so /pagefind exists
pnpm run test:e2e           # boots preview server and runs tests
```

The Playwright config (`playwright.config.ts` at repo root) spins up
`pnpm run preview` on `http://127.0.0.1:4321` and reuses an existing
server in development.

## Environment status (current sandbox)

E2E browser tests are **environment-blocked** here because the sandbox
lacks the native libraries Chromium needs:

- `libnspr4`
- `libnss3`
- `libasound`

`pnpm run test:e2e:install` will fail with an apt error until these are
added. The script is kept intact so CI runners with the standard
`ubuntu-latest` image can install and execute the suite without changes.

## CI

`.github/workflows/e2e.yml` is **not** present yet (no E2E workflow
exists in this milestone). When wired up it should:

1. Install Node 20.
2. `pnpm install --frozen-lockfile`.
3. `pnpm run test:e2e:install`.
4. `pnpm run build`.
5. `pnpm run test:e2e`.

## Existing specs

- `tests/e2e/home.spec.ts` — smoke test that the home page renders the
  primary headline, the category grid, and a featured project.

Add new specs in this directory; they will be picked up automatically.
