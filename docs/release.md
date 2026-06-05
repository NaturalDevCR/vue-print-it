# Release Checklist

Use this checklist before publishing a new package version.

```bash
npm ci
npm run release:check
npm audit --audit-level=moderate --omit=dev
npm audit --audit-level=moderate
```

`release:check` runs:

1. TypeScript checks.
2. Vitest regression tests.
3. Package build.
4. VitePress docs build.
5. `npm pack --dry-run`.

Use `npm audit --omit=dev` as the blocking package gate, then run the full audit to review development tooling. VitePress is a development dependency and can surface advisories that do not affect the published runtime package.

## Package Contents

The npm package is limited by the `files` field in `package.json`. A dry run should include:

- `LICENSE`
- `README.md`
- `package.json`
- Generated files under `dist/`

The VitePress source docs stay in the repository and are not published in the npm package.

## Docs

Run the docs locally before changing public examples:

```bash
npm run docs:dev
```

Build and preview the static site:

```bash
npm run docs:build
npm run docs:preview
```

If the site is deployed under GitHub Pages for this repository, configure the deployment to use `/vue-print-it/` as the VitePress base path.
