# LocalBite

LocalBite is a local-first recipe creator built as a Vue, TypeScript, Bootstrap, and Material Icons progressive web app.

## Local Development

The project was requested with Bun first and pnpm as the fallback. Bun was not available in this workspace, so the lockfile and scripts use pnpm.

```sh
pnpm install
pnpm dev
```

## Checks

```sh
pnpm typecheck
pnpm build
```

## Deployment

GitHub Pages deployment runs when a GitHub release is published. The workflow also supports manual runs from the Actions tab.

The Vite base path is configured automatically for project pages and user or organization pages.
