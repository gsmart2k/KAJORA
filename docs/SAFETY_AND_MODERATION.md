# Safety and moderation pilot

KAJORA's pilot rule: **meet, inspect the product, agree on shares, then pay**. No advance payments, deposits or reservation fees. The app does not collect or guarantee payments, and cannot prevent external transfers.

## Enable this update

1. Pull main. No new npm dependencies are required.
2. In the Supabase SQL Editor, run the entire `supabase/migrations/202610160001_safety_and_moderation.sql` file once, after all previous migrations. It runs in a transaction. If it fails, resolve the error before retrying; do not run individual fragments.
3. Give your existing account admin access using the following SQL, replacing the email with the exact email you sign into KAJORA with. This is a trusted SQL Editor operation; no admin keys belong in the app or `.env.local`.

```sql
insert into public.moderators (user_id)
select id from auth.users where lower(email) = lower('YOUR_LOGIN_EMAIL')
on conflict (user_id) do nothing;

-- Verify that the account you intended was granted access.
select u.email, m.created_at
from public.moderators m join auth.users u on u.id = m.user_id;
```

If the result is empty, the email did not match an existing account. Use a separate non-admin test account to test suspension. The app will not suspend its own admin or another moderator.

4. Restart Expo: `npx expo start --tunnel --clear`.
5. Open **Profile → Safety centre and reports → Open admin review**. Admin access is checked by the database, not by email hard-coded in the app. Use Refresh after changing admin permissions.

To remove admin access, run in the SQL Editor:

```sql
delete from public.moderators
where user_id in (select id from auth.users where lower(email) = lower('YOUR_LOGIN_EMAIL'));
```

## Member experience

- Payment reminders appear on creation, intention details, the pinned chat area, group plans and Safety centre.
- Plans label the location/time as the meeting and collection arrangement. Members confirm the plan, not an advance payment.
- Report an intention from its details, or choose **Report message** beneath another member's message. A message report identifies the author server-side.
- Reasons: advance payment, fake intention/product, impersonation, harassment, other. A 10–2000 character description is required.
- Reports are visible only to the submitting user and authorised admins. Admins receive a server-generated copy of reported content; reported image evidence is also visible to them. We do not give moderators general private-chat access.
- Retrying an open report on the same content returns the same report. A user can create at most 10 reports per 24 hours, enforced in the database.
- Profile → Safety centre shows the member's latest 50 reports and status. Reviews are manual, not immediate. No notification or promised response time is implemented in this release.

## Admin review

The queue loads 50 reports per page and supports open-only or all reports. Every action needs a review note and a second confirmation. Decisions are audited with actor, action, note and timestamp:

- **Mark reviewed**: closes the report without changing the account or intention.
- **Dismiss report**: records that no action is being taken.
- **Hide intention and close its group**: removes the listing from discovery, blocks joining and makes its group read-only. Existing members retain the discussion. This screen does not reverse hiding; use it deliberately. It does not imply any purchase occurred.
- **Suspend reported account**: blocks direct REST access to app data and business RPCs, including new posts, chat, plans, polls and image access/upload. Public profiles and source intentions of suspended organisers are hidden from new viewers; existing participants retain relevant purchase context. The suspended user can still read their own profile status. The app checks account status while foregrounded and shows a suspension screen.
- **Restore reported account**: restores access after a review, with an audit note. Find the report using the all-reports filter. Restoration does not reopen hidden intentions.

Suspension does not delete an account or revoke its Supabase Auth session; database policies enforce restrictions even with an existing token. Already downloaded data cannot be recalled. Previously issued image URLs can remain valid for their remaining short expiry (currently 60 seconds). Pilot appeals are handled by contacting the pilot organiser; a public support channel still needs to be chosen before wider release.

## Security implementation and maintenance

- New tables use RLS with no direct client write policies. Membership in `moderators` can only be assigned by trusted database administration.
- Ordinary profile updates cannot change account state, verification, completed-group counts or user IDs.
- Restrictive active-account policies cover existing application tables and the group image bucket.
- Existing public business RPCs now call an active-account guard before their original implementations. The originals have the suffix `_before_safety` and all public/anon/authenticated execute access is revoked. Future changes must preserve the active guard and must never re-grant these internal implementations to clients.
- Source posts, membership checks and reporter identity are validated on the server; users cannot manufacture evidence by inserting reports directly.
- Reported images are available to moderators only when their paths were captured in a validated message report. Other group images remain private.
- Reports and audit records are retained; no automatic evidence-retention cleanup has been implemented yet.

## Verification and real-project acceptance

Automated PostgreSQL-compatible tests apply every migration and exercise RLS with ordinary authenticated roles. Run with an external test dependency installation:

```bash
npm install --prefix /tmp/kajora-db-check @electric-sql/pglite
NODE_PATH=/tmp/kajora-db-check/node_modules node scripts/test-plans-polls.cjs
```

Coverage includes report privacy, fabricated/direct submissions, duplicate reports, rate limits, unapproved access, admin-only actions, evidence isolation, profile privilege escalation, old RPC bypass attempts, suspension with an existing identity, restoration and hidden read-only groups. Existing planning/poll/image behaviour is also retested.

After applying this migration to your real Supabase project, test with at least three accounts:

1. Owner posts an intention; another user reports it for requesting a deposit.
2. Confirm the owner cannot see the report and the reporter can see its status.
3. Admin reviews the report from Safety centre; another non-admin account should have no admin button.
4. In an approved group, report a message/photo. Admin should see only the reported evidence, not the group conversation.
5. Admin suspends the non-admin owner. On the owner's already-open device, verify the suspension screen and rejection of app actions. Restore through the reviewed report and confirm access returns.
6. Hide a test intention: it disappears from discovery, while current members retain a read-only conversation.
7. Verify that the new reminders and report modal are usable with the keyboard on both phones.

The local tests do not replace testing live Supabase Storage URLs or a physical phone. No live project migrations were applied by the coding agent.
