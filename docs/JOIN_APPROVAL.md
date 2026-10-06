# Approved membership rollout

## Install
1. Stop Expo and pull main.
2. In Supabase SQL Editor, run supabase/migrations/202610050001_join_approval.sql after the two existing migrations.
3. Restart with npx expo start --clear. No new dependencies are needed.

Apply the migration before running the updated app: it adds joining_closed and the request-review functions.
Existing members retain access. Requests submitted after the migration require approval.
Approved members can read earlier chat history. This is database-enforced membership access, not end-to-end encryption.
No live database test has been run by the assistant.

## Three-account acceptance test
Use separate browser profiles/private sessions for A, B and C.
1. A creates a new intention with total people = 2 (includes A).
2. B requests to join. B sees Awaiting approval, cannot open the room, and can cancel.
3. A opens the intention, refreshes requests, and approves B.
4. B refreshes status and opens the private group. It must show 2 members.
5. A and B exchange messages and reload to check persistence.
6. C cannot read the group/messages even with its URL or a direct API request using C's token.
7. C cannot join the full group. A closing joining also blocks new requests/approvals.
8. On another plan, decline C; no membership or chat access should be granted.
9. A non-owner calling review_join_request must be rejected.
10. Concurrent approvals for the final place must permit only one: the post row lock serializes capacity checks.
11. Test an unspecified size: no invented denominator/progress target appears.
12. Wrong login credentials fail; missing environment configuration cannot create a demo session.

The organiser and applicant have explicit refresh controls; live request notifications are not included.
