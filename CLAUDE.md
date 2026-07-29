# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js SDK for the DHL eCommerce Solutions Americas API. It provides a JavaScript interface for shipping operations including label generation, manifest creation, package tracking, and rate calculation.

## Development Commands

### Testing
- `npm test` - Run all tests using the built-in `node:test` runner
- `npm run test:only` - Run only tests marked with `{ only: true }`
- `npm run coveralls` - Run tests with code coverage (for CI/CD)
- To run tests matching a pattern: `node --test --test-force-exit --test-name-pattern "pattern" test`
- Always keep `--test-force-exit`; the access token cache holds a timer that would otherwise
  keep the process alive. Do not add `--test-concurrency`.

### Linting
- `npx eslint .` - Run ESLint on the entire codebase
- ESLint configuration uses the new flat config format (eslint.config.js)

## Architecture

### Core Module Structure
The SDK follows a single-class pattern where all API methods are exposed through the `DhlEcommerceSolutions` class in index.js.

### Key Components:

1. **Authentication**
   - OAuth2 client credentials flow
   - Access tokens are cached in memory using `memory-cache` module
   - Tokens auto-refresh at half their expiry time

2. **API Methods** - Every method that makes a request takes an optional callback and returns a
   promise when the callback is omitted (the executor pattern). `applyDimensionalWeight` is
   synchronous.

   - `getAccessToken()` - Handles OAuth authentication
   - `createLabel()` - Generate shipping labels (ZPL or PNG format)
   - `createManifest()` - Close out packages for pickup
   - `downloadManifest()` - Retrieve generated manifests
   - `findProducts()` - Get available shipping products with rates
   - `getTrackingByPackageId()` / `getTrackingByTrackingId()` - Track packages
   - `applyDimensionalWeight()` - Calculate dimensional weight for rate requests

3. **Error Handling**
   - A non-200 response throws an `@stores.com/http-error` `HttpError`
   - `err.message` is `"<status> <statusText>"`, or the joined `errors[]` messages when the body
     carries them; the status is on `err.cause.status`; the body is on `err.json` and `err.text`
   - Errors raised before a response exists (unparseable URL, network failure, timeout) are
     whatever `fetch` threw, and have no `cause.status`

### Dependencies
- `@stores.com/http-error` - Error class for non-ok fetch responses
- `memory-cache` - In-memory caching for access tokens

HTTP requests use the built-in `fetch`, so Node.js 18 or later is required and there is no HTTP
dependency. Every request carries `signal: AbortSignal.timeout(options.timeout)`, default 10000ms.

### Testing
- `node:test` with `node:assert`
- Tests located in test/index.js
- Coverage reporting via Coveralls in CI/CD. Coveralls fails the build on any coverage decrease,
  so keep index.js fully covered
- Most tests call the live DHL sandbox and need `CLIENT_ID` / `CLIENT_SECRET` in the environment;
  without them they fail with `Unauthorized`. The non-200 tests point `environment_url` at
  httpbun.com and rely on a trailing `#` turning the appended path into a fragment

## API Configuration

The SDK requires:
- `client_id` - DHL API client ID
- `client_secret` - DHL API client secret
- `environment_url` - API endpoint (defaults to sandbox: https://api-sandbox.dhlecs.com)
- `timeout` - Milliseconds before a request is aborted (defaults to 10000)

Production URL: https://api.dhlecs.com

## CI/CD

GitHub Actions workflow (.github/workflows/test.yml):
- Runs on push, PR, and manual dispatch
- Node.js 24.11.0
- Executes linting, testing, and coverage reporting
- Sends Slack notifications for build status