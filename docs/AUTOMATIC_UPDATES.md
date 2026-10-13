# Automatic updates and group activity

The app checks Supabase every five seconds while visible, using the existing authenticated REST endpoints and membership policies. It refreshes intentions, approval status, organiser requests and messages for approved groups. It pauses checks in background tabs/apps and checks again on return. No SQL migration, Realtime publication, or push-notification setup is required.

The Groups tab shows an activity count: groups with unread messages or not yet opened, plus pending join requests. Request cards link to the organiser's review screen. Approved groups appear automatically; opening a group clears its new indicator. Messages loaded while that room is focused and the app is visible are marked read.

Read timestamps are stored separately per account on the current device/browser profile. They do not sync across devices. On first use, existing groups appear as new and existing messages from other members appear unread until opened. The timestamp comes from loaded server messages, not the device clock. Own messages do not increase unread counts. Signing out remounts the account data providers; group membership refreshes discard cached messages from groups no longer accessible.

This is foreground polling, not WebSocket realtime or phone push notifications. Typical updates take five seconds plus network time; the first message fetch for a newly approved group may take another cycle. It currently fetches paginated message history for each joined group, which is suitable for the small alpha. Before scaling, replace history polling with incremental messages and server-side unread summaries.

## Verification

- `npm run typecheck`
- `node scripts/test-group-activity.cjs`
- `npm run build:web`
- `npm run lint` (the repository currently has existing hook/template lint errors).

Manual check with separate browser profiles:
1. Keep the organiser's Groups screen open; request to join from another account. A request card and activity count should appear without refreshing.
2. Approve the request. The applicant's intention button should change to Open private group automatically, and the group should appear in Groups.
3. Keep both rooms open and exchange messages. Messages should appear within the polling interval without duplicates.
4. Leave one account on Groups and send a message from the other. Check the unread count; open the room and confirm it clears. Reload and confirm it stays cleared.
5. Switch accounts and confirm read state does not carry over. Test a third unapproved account: chat must remain inaccessible.
6. Background the app/tab, send a message elsewhere, then return. Updates should resume.

A live Supabase multi-account test is still required; local checks do not establish server-side access control.
