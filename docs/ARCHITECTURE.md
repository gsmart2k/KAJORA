# KAJORA Technical Architecture

**Status:** Initial implementation decision  
**Client:** Expo SDK 57 / React Native 0.86 / TypeScript  
**Backend target:** Supabase / PostgreSQL

## Architecture decision

KAJORA uses a universal Expo application for Android, iOS, and web. The public web experience is important because WhatsApp recipients should be able to open a shared intention before installing the mobile application.

The application is intentionally divided into four layers:

1. **Routes and screens** in `src/app/`
2. **Reusable interface components** in `src/components/`
3. **Product state and domain types** in `src/state/`, `src/data/`, and `src/types/`
4. **Persistent backend** represented by `supabase/`

The first vertical slice uses a typed in-memory provider so the full interaction can be tested without credentials. The provider is a temporary adapter, not the intended source of truth.

## Technology choices

| Concern | Choice |
| --- | --- |
| Universal application | Expo + React Native |
| Language | TypeScript with strict mode |
| Routing and deep links | Expo Router |
| Interface system | React Native primitives and KAJORA design tokens |
| Persistent database | PostgreSQL through Supabase |
| Authentication | Supabase phone OTP with a Nigeria-tested SMS provider |
| Realtime group updates | Supabase Realtime Broadcast |
| Media | Supabase Storage |
| Location search | PostGIS |
| Transactional state changes | PostgreSQL functions |
| External integrations | Supabase Edge Functions |
| Push notifications | Expo Notifications |
| Builds | EAS Build |

## Why there is no generic UI framework

KAJORA needs an understated identity. The component layer uses React Native primitives and a small token system rather than importing a visual kit that would make the product look like a generic dashboard.

The current visual system is in `src/theme/index.ts`.

## Data ownership

PostgreSQL will be the authoritative source for:

- profiles;
- posts;
- interest records;
- group membership;
- messages;
- group decisions;
- versioned final plans;
- confirmations;
- notifications; and
- moderation reports.

Realtime events inform connected clients that data changed. They do not replace stored records.

## Sensitive state transitions

Clients must not directly set lifecycle states such as `confirmed` or `completed`. The database migration establishes functions for actions such as expressing and withdrawing interest. Later migrations should follow the same pattern for:

- proposing a plan;
- confirming a specific plan version;
- reopening a plan after a material change;
- marking fulfilment complete; and
- applying administrative moderation actions.

Every action should verify the caller, current state, membership, and version before changing data.

## Public and private location

Public posts store a human-readable approximate area. Exact pickup information belongs to the private group plan and must be readable only by participating members.

PostGIS can be added to support proximity ranking without exposing raw coordinates in the public API.

## Current vertical slice

The current implementation supports:

- public intention discovery;
- search and category filtering;
- buying-intention and available-share presentation;
- intention details;
- interest expression and withdrawal;
- active-group listing;
- structured decisions and group conversation;
- new buying-intention publishing; and
- profile and trust-language exploration.

The data resets when the application reloads. This is expected until the Supabase adapter replaces the in-memory provider.

## Integration sequence

1. Provision development and production Supabase projects.
2. Apply migrations from `supabase/migrations/`.
3. Test Nigerian phone OTP delivery with the selected SMS provider.
4. Add the Supabase client and secure mobile session storage.
5. Replace read operations in `KajoraProvider` with repository calls.
6. Replace mutations with database functions.
7. Add Realtime subscriptions for active groups.
8. Add push-token registration and notification workers.
9. Add storage policies and image upload.
10. Remove the in-memory adapter after the end-to-end backend flow passes.

## Environment variables

Only publishable client values use the `EXPO_PUBLIC_` prefix. Service-role secrets, SMS credentials, notification credentials, and payment secrets must never be bundled into the Expo client. They belong in protected server or Edge Function environments.

