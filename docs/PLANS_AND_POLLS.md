# Group plans and polls

## Apply this update

Pull main. In your Supabase project's SQL Editor, run the entire file `supabase/migrations/202610130001_plans_and_polls.sql` once. This follows the initial schema, alpha helpers and join-approval migrations. The migration is transactional and retains existing intentions, members and messages. Restart Expo after it succeeds.

The new UI displays a planning load error until the migration has been applied. No new environment variables or npm dependencies are needed for the app.

## Plans

Only the intention organiser can publish a plan. Required details: product/quantity, supplier, total in naira, each member's portion and cost, pickup location, and pickup date/time. Allocations and pickup dates are free text in this first version: members must review them; the app does not calculate or validate the sum of individual shares.

Publishing creates an immutable numbered version and a response record for each currently approved member. New joins pause. Everyone, including the organiser, explicitly confirms or requests changes with an explanation. All responses are visible to approved members. All current members must confirm before the organiser can mark a purchase completed. A poll vote never counts as plan confirmation.

A revised plan supersedes the old one and resets every confirmation. Stale edit forms and replies to superseded versions are rejected. Leaving during confirmation/after confirmation supersedes the plan and returns the group to planning; the organiser must publish another version. The organiser can reopen joining at that point, before publishing again.

The organiser may cancel without unanimous agreement. Completion and cancellation make the conversation, plan and polls read-only. Group records remain available to members, including after the source intention expires. Completed and cancelled purchases leave discovery. Completion increments the active members' completed-group totals once; cancellation does not.

## Polls

Any approved member may create a poll with 2–6 distinct options. Each member has one visible vote and can change it until voting closes. The poll creator or organiser may close the poll. Historical votes remain after a participant leaves, identified as a former member. Polls and responses update while the group screen is open using the existing foreground refresh interval.

## Permissions

Plan writes and poll writes use authenticated RPCs with explicit membership/organiser checks and an empty search path. Group operations lock the source post then the group, serialising plan changes, votes and closure. Direct plan creation, assignment updates and source-post updates are disabled for clients; the existing organiser RPCs remain available. New tables use RLS. Unapproved users cannot fetch workspace data, read poll votes or vote. This is membership access control, not end-to-end encryption.

## Checks

TypeScript, changed-file lint and Expo web export are checked. Full-project lint has existing unrelated hook/template errors.

A PostgreSQL-compatible PGlite test applies all migrations and exercises organiser/member/outsider permissions, version resets, stale responses, completion requirements, change requests, vote replacement, closed voting, withdrawal, completion and cancellation. Run from the repository root:

```sh
npm install --prefix /tmp/kajora-db-check @electric-sql/pglite
NODE_PATH=/tmp/kajora-db-check/node_modules node scripts/test-plans-polls.cjs
```

This isolated database test is not a live Supabase or physical-device test. After applying the migration, test with two approved accounts and one outsider:

1. Create a poll, vote from each member, change one vote, and close voting.
2. Publish a plan; both members should see it automatically.
3. Request a change, revise the plan, and check that confirmations reset.
4. Confirm the new version from both accounts, then complete the purchase.
5. Check that archived chat remains readable and sending is disabled.
6. Use a separate group to test cancellation and a third unapproved account to test denied access.
