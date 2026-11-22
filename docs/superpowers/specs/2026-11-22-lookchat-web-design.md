# LookChat Web Preview Design

## Intent
Run the existing LookChat application in a secure browser URL during development so the user can iterate without reinstalling an APK. Preserve the Android app and its shared Supabase backend.

## Goals
- Enable Expo's Metro web bundler and static web export.
- Reuse the existing authentication, profile, nearby-presence, and chat flows.
- Use browser geolocation on web and keep Expo Location on native platforms.
- Preserve Supabase session persistence and handle browser email-confirmation redirects.
- Publish a preview from a dedicated branch using free GitHub Pages hosting.

## Non-goals
- Rebuild the app as a separate React/Vite project.
- Change Supabase schema, policies, or RPC contracts.
- Claim realtime chat; current chat refresh remains manual.
- Replace or release the Android APK as part of this web-preview task.

## Constraints
- Keep the current Expo SDK and React Native versions; do not perform an SDK upgrade.
- Keep Supabase publishable key client-side only; never add service-role keys or user secrets.
- Browser geolocation requires HTTPS and explicit browser permission.
- Work on `feature/web-preview`; do not modify `main` during this preview task.

## Approaches
1. Add web support to the existing Expo app — selected. It preserves one codebase and the shared backend, and leaves Android behavior in place.
2. Build a separate web application — rejected for this phase because it duplicates UI and behavior.
3. Deploy through EAS Hosting — not selected for the first preview because GitHub Pages can host a static export from this public repository without a paid hosting plan.

## Implementation choices
- Expo Metro static web export.
- Platform-specific location adapter: browser Geolocation API on web, Expo Location on Android/iOS.
- Browser alert fallback for existing feedback messages.
- GitHub Actions exports the web bundle and deploys it to GitHub Pages.
- The initial deployment is a preview; production/custom domain decisions are deferred.

## Acceptance
- Web export completes successfully in CI.
- Location adapter tests cover browser success/permission denial and native permission/coordinates.
- Existing Android build workflow remains unchanged.
- The deployed preview loads over HTTPS and renders the Arabic login screen.
- Authentication and location/chat end-to-end behavior still require manual verification in the browser.
