# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - 2026-06-04

### Added

- Added `includeRoot`, enabled by default, so printed content preserves the target element itself.
- Added `pageSize`, `orientation`, `scale`, and `printCss` controls for print CSS.
- Added `styleUrls` and `inlineStyles` as clearer alternatives to mixed `styles` entries.
- Added `styleLoadTimeout`, `waitForImages`, and `imageLoadTimeout` readiness controls.
- Added optional hidden iframe printing via `printTarget: 'iframe'`.
- Added Vue global property typings for `$print`, `$printBridge`, and `$printBridgeState`.
- Added Vitest/JSDOM regression tests and CI.

### Changed

- Browser printing now waits for stylesheet links, fonts, and images before calling `print()`.
- Print HTML is generated from a cloned target element so form state and canvas fallbacks do not mutate the original DOM.
- Bridge plugin now enhances the `BridgeClient` class instance without losing prototype methods.
- Bridge client now respects configured timeout, retry attempts, headers, and debug logging.
- Repository ignores generated/build artifacts and local editor/system files.

### Fixed

- Fixed `usePrint()` not respecting custom `globalMethodName` values.
- Fixed bridge client method loss caused by spreading class instances.
- Fixed package export condition order for TypeScript consumers.
