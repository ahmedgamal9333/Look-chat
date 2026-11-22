# LookChat Web Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the existing Expo LookChat app to run as a responsive HTTPS website while preserving Android support.

**Architecture:** Keep the single Expo/React Native codebase. Add Expo web dependencies and static export configuration, route geolocation through a platform adapter, and deploy the exported bundle from a dedicated branch using GitHub Pages.

**Tech Stack:** Expo SDK 58, React Native 0.88, React 19.3, React Native Web, Expo Location, Supabase, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-22-lookchat-web-design.md`

## Global Constraints
- Do not upgrade Expo SDK or React Native.
- Do not change Supabase schema, RLS, or RPC contracts.
- Do not add service-role keys or secrets to the public repository.
- Browser location requires HTTPS and user permission.
- Keep all work on `feature/web-preview`; leave `main` unchanged.

## Review Focus
- Browser blocks location permission: show a useful Arabic explanation and do not publish presence.
- Browser lacks Geolocation API: show a useful error instead of crashing.
- Native permission flow: preserve the existing Expo Location behavior.
- Supabase email confirmation returns to the web URL: enable URL session detection on web only.
- GitHub Pages project subpath: ensure static assets use `/Look-chat` as base URL.

---

### Task 1: Platform location adapter

**Files:**
- Create: `src/location.js`
- Create: `tests/location.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces `getCurrentCoordinates({ platform, locationApi, geolocation })`, resolving to `{ latitude, longitude }` or rejecting with a meaningful error.

- [ ] Write Node tests for browser coordinates, browser permission denial, native permission denial, and native coordinates.
- [ ] Run `npm test` and confirm the tests fail because the adapter is missing.
- [ ] Implement the minimal adapter.
- [ ] Run `npm test` and confirm all tests pass.

### Task 2: Expo web configuration and browser-safe app behavior

**Files:**
- Modify: `package.json`
- Modify: `app.json`
- Modify: `App.js`

- [ ] Add the Expo-compatible web dependencies and test script.
- [ ] Configure Metro web bundling, static output, and the GitHub Pages base path.
- [ ] Use the location adapter for web and native platforms.
- [ ] Enable Supabase URL session detection only on web.
- [ ] Route existing alerts to browser alerts on web while preserving native alerts.
- [ ] Constrain auth/content widths for desktop while keeping mobile layout fluid.
- [ ] Run the location tests and the Expo web export.

### Task 3: Preview deployment and documentation

**Files:**
- Create: `.github/workflows/web-preview.yml`
- Modify: `README.md`

- [ ] Add a GitHub Actions workflow triggered by pushes to `feature/web-preview` and manual dispatch.
- [ ] Run tests, export static web assets, and deploy to GitHub Pages.
- [ ] Document the preview URL pattern and the one-time GitHub Pages setup requirement.
- [ ] Inspect the workflow result and deployment URL; report any required one-time repository setting separately.

### Task 4: Final verification

- [ ] Confirm the workflow is green and the static site responds over HTTPS.
- [ ] Confirm the Android workflow file and `main` branch were not modified.
- [ ] Report that browser login, location, and chat still require manual end-to-end testing.
