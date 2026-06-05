# Contributing

Thanks for helping improve `vue-print-it`.

## Local Setup

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run docs:build
```

## Documentation

The documentation site is built with VitePress.

```bash
npm run docs:dev
npm run docs:build
npm run docs:preview
```

## Release Check

Before publishing, run:

```bash
npm run release:check
npm audit --audit-level=moderate --omit=dev
npm audit --audit-level=moderate
```

Use the production audit as the blocking release gate. Run the full audit as a
review step for development tooling as well.

The npm package is intentionally limited by the `files` field in `package.json`.
`npm pack --dry-run` should only include `LICENSE`, `README.md`, `package.json`,
and generated files under `dist`.

## Repository Hygiene

Do not commit generated dependencies, local system files, IDE folders, or build
output. The repository ignores `node_modules`, `example/node_modules`, `dist`,
`.DS_Store`, and `.idea`.

## Testing Guidance

Add focused regression tests for browser-print behavior, especially:

- DOM cloning and form state preservation.
- Stylesheet, font, and image readiness.
- Bridge availability, retries, and print request payloads.
- Vue plugin installation and custom `globalMethodName` behavior.
