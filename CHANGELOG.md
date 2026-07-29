# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - Unreleased

### Breaking

- `err.status` is gone. The status is now on `err.cause.status`.
- `err.response` is gone. The parsed body is on `err.json` and the raw body is on `err.text`.
- The error thrown for an unparseable `environment_url` now comes from `fetch`: `Invalid URI "invalid/auth/v4/accesstoken"` is now `Failed to parse URL from invalid/auth/v4/accesstoken`.
- A 200 response whose body is not JSON now throws a `SyntaxError` instead of returning the raw string.
- Node.js 18 or later is required, declared as `engines: { "node": ">=18" }`.

### Added

- Every method that makes a request returns a promise when its callback is omitted, so `await` works. Calls that pass a callback are unchanged.
- A `timeout` constructor option, in milliseconds, defaulting to `10000`. It is applied to every request.

### Changed

- HTTP requests use the built-in `fetch`. The `request` and `http-errors` dependencies are gone, and a non-200 response now throws an `@stores.com/http-error` `HttpError`.

## [0.4.0] - 2026-02-12

### Changed

- The license is now MIT.
- The repository moved from the `mediocre` GitHub organization to `stores-com`.

`index.js` is identical to 0.3.0, so there are no runtime changes. The rest of the release is tooling: the test suite moved from Mocha to `node:test`, and CI was updated.

## [0.3.0] - 2022-05-26

### Added

- `getTrackingByTrackingId()`.

## [0.2.0] - 2022-05-20

### Added

- `applyDimensionalWeight()`.

## [0.1.0] - 2022-05-19

### Breaking

- The constructor option `environmentUrl` was renamed `environment_url`.
- `downloadManifest()` takes `(pickup, requestId, callback)` instead of a single request object.

### Added

- `createManifest()` and `downloadManifest()`.

## [0.0.1] - 2022-05-13

### Added

- Initial release, with `getAccessToken()`, `findProducts()`, `createLabel()`, and `getTrackingByPackageId()`.

## Notes

Entries for 0.0.1 through 0.4.0 were reconstructed from git history and npm publish times. Only 0.4.0 has a git tag, so there are no comparison links for the releases before it.

Version 0.3.1 appears in git history but was never published to npm, so it has no entry.
