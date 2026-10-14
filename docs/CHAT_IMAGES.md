# Private chat photos

## Setup

1. Pull main and run `npm install` (adds Expo Image Picker and Image Manipulator).
2. Run the entire `supabase/migrations/202610140001_chat_images.sql` file in Supabase SQL Editor after the plans-and-polls migration. It creates the private `group-images` bucket, its policies and the image-message fields. Do not make the bucket public.
3. Restart using `npx expo start --clear`.

Expo Go includes the two photo modules. Custom native builds must be rebuilt for the camera/photo permission descriptions; microphone permission is disabled. Browser camera support depends on the browser and device; choosing an existing image remains available.

## Behaviour

Tap + beside the chat composer. Choose a photo or take one, review the preview, add an optional caption and send. Photos are converted to JPEG, resized to a maximum long edge of 2400 pixels and limited to 5 MB after preparation. Source files larger than 25 MB are rejected. Keep original receipts separately if full resolution is needed. Only images are supported, not PDF receipts or videos.

Uploads show progress. A failed send keeps the selected image for retry in the same screen session. Retrying a sent image uses the same object path and returns the original message to prevent duplicates. Photos open full-screen when tapped. Uploading a receipt does not mark a payment verified.

## Access and retention

Objects are stored under group ID / uploader ID / generated filename. Uploads require current membership in an open group, and clients cannot overwrite objects. A database trigger prevents attaching another uploader's object or an image from another group. Reads require approved group membership, including for completed groups. Closing a purchase prevents new uploads/messages.

Viewing links expire after 60 seconds and renew while the room is visible. An already issued link can remain usable until it expires; downloaded copies cannot be revoked. This is private storage with membership access control, not end-to-end encryption.

There is no client deletion policy for uploaded objects. Failed/abandoned uploads may leave unreferenced objects; a future trusted cleanup job should remove sufficiently old unreferenced objects through the Storage API. Never delete storage.objects rows directly. Retrying after leaving the screen or restarting the app starts a new attachment.

## Verification

TypeScript, changed-file lint, web export and binary/base64 conversion are checked. The database test in scripts/test-plans-polls.cjs now stubs Storage tables, applies all migrations and tests image membership policies, wrong-uploader rejection, retry deduplication and closed-group upload rejection. This does not exercise Supabase's actual Storage HTTP service or real device camera permissions.

Live test after migration:
- Send a product photo with a caption from account A; account B should receive it and open it full-screen.
- Send a receipt without a caption and check legibility.
- Interrupt a send, retry, and check that only one message appears.
- An unapproved account must not read the object or upload into the group.
- Complete/cancel a group and confirm attachments are disabled but old images remain readable.

Full-project lint still reports existing hook/template errors.
