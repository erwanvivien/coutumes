# Agent instructions

npm workspace monorepo: `apps/web` (Next.js) and `packages/shared` (framework-agnostic code —
shared types, URL helpers).

## Shared code

Before writing framework-agnostic logic (types, URL helpers, formatting), check
`packages/shared/src` first — it's imported as `@template/shared`.
