# KAJORA Product Specification

**Status:** Draft for MVP planning  
**Initial market:** Osogbo, Osun State, Nigeria  
**Initial platform:** Mobile-first progressive web application  
**Brand promise:** Buy together. Spend less.

## 1. Purpose

This document defines the intended behaviour of the first KAJORA product. It is the working source of truth for product design, engineering, content, operations, and pilot testing.

KAJORA connects people who have compatible buying intentions. It does not assume that the creator already owns, has sourced, or has priced the product. Interested people form a group and decide the details together.

This specification describes product behaviour. It does not constitute legal, financial, veterinary, food-safety, or regulatory advice. Appropriate professional and local operational review is required before public transactions are facilitated.

## 2. Product definition

### 2.1 Core problem

A person may want only part of a bulk item, but finding nearby people who want the remaining quantity is slow, unreliable, and dependent on personal networks.

### 2.2 Product proposition

KAJORA allows a person to publish a buying intention, notify potentially interested people nearby, gather them in a group room, structure their shared decisions, and record an agreed purchase plan.

### 2.3 Distinction from a conventional marketplace

| Conventional marketplace | KAJORA |
| --- | --- |
| Begins with available inventory | Begins with buying intention |
| Seller defines the product and price | Interested buyers can decide product, vendor, price, and allocation together |
| “Buy now” is the primary action | “I’m interested” is the primary action |
| Product listing is the core object | Intention and group are the core objects |
| Checkout precedes community | Group agreement precedes any payment |

### 2.4 Product types

#### Buying intention

Created by someone looking for other people who may want portions of the same purchase.

The product, final price, vendor, and exact allocation may all be undecided.

#### Available share

Created by someone who already owns, has sourced, or can supply a defined portion of an item.

The available quantity, price, location, and fulfilment details should be substantially known before publication.

Buying intentions are the primary experience. Available shares are complementary supply-side posts.

## 3. Goals and non-goals

### 3.1 MVP goals

- Make it easy to express a buying intention.
- Help relevant nearby people discover that intention.
- Convert passive interest into a functioning group.
- Help the group reach a documented agreement.
- Allow members to confirm or decline the agreement clearly.
- Provide sufficient moderation and privacy controls for a supervised pilot.
- Learn how real groups source, divide, pay for, and collect purchases.

### 3.2 MVP non-goals

- Holding or pooling customer money
- Acting as an escrow provider
- Guaranteeing product quality or group completion
- Automatically sourcing vendors
- Operating a delivery fleet
- Determining livestock weights or portion fairness
- Supporting every product category
- Launching throughout Nigeria
- Replacing professional inspection or food-safety processes
- Building native mobile applications

## 4. Target users

### 4.1 Primary user: intention creator

A person who knows what they want but does not want or cannot use the full quantity. They need to find compatible people nearby.

Primary needs:

- create a post quickly;
- reach relevant people;
- understand who is genuinely interested;
- coordinate decisions; and
- avoid bearing the entire purchase alone.

### 4.2 Interested member

A person who discovers an intention that matches a current or near-future need.

Primary needs:

- understand what is decided and undecided;
- express interest without making an immediate financial commitment;
- evaluate the people involved;
- participate in group decisions; and
- leave before confirming a final plan.

### 4.3 Available-share seller

A person or business with a defined portion available.

Primary needs:

- communicate quantity, price, condition, location, and deadline;
- demonstrate credibility; and
- identify serious potential buyers.

### 4.4 Administrator

A KAJORA operator responsible for the safety and integrity of the pilot.

Primary needs:

- review users and posts;
- act on reports;
- suspend harmful activity;
- maintain categories and service locations;
- inspect an audit trail; and
- support pilot groups when appropriate.

## 5. Product principles

### 5.1 Interest is not commitment

Selecting **I’m interested** gives the user access to the group planning context. It does not reserve inventory, create a debt, or promise payment.

### 5.2 Undecided information must look undecided

The interface must distinguish estimates from confirmed values. An estimated budget cannot be displayed like a final price.

Recommended labels:

- Estimated budget
- Suggested portion
- Vendor not selected
- Date is flexible
- Final plan pending

### 5.3 Group agreement must be explicit

Messages in a chat do not constitute a final agreement. A structured final plan must be proposed and separately confirmed.

### 5.4 Public location must be approximate

Public posts may show a town, local government area, or neighbourhood. Exact residential or pickup addresses remain private until appropriately shared with the group.

### 5.5 Trust signals must be truthful

A verification badge must state what was verified. Possible future distinctions include phone verified, identity reviewed, business reviewed, and completed-group history.

## 6. Information architecture

### 6.1 Primary navigation

The mobile navigation contains:

- **Home** — public wall and discovery;
- **Groups** — active and previous group rooms;
- **Create** — new buying intention or available share;
- **Notifications** — relevant activity and alerts; and
- **Profile** — identity, preferences, verification, and settings.

The Create action may be visually prominent while remaining consistent with the calm interface.

### 6.2 Key destinations

- Onboarding
- Home/public wall
- Search and filters
- Post details
- Create post
- Group room
- Group plan
- Notifications
- Profile
- Reports and support
- Admin console

## 7. Core journeys

### 7.1 Create a buying intention

1. An authenticated user selects **Create**.
2. The user chooses **I want people to buy with me**.
3. The user selects a category and product label.
4. The user states the share or quantity they may want, or selects **Flexible**.
5. The user selects an approximate location.
6. The user selects a preferred date or marks it flexible.
7. The user may provide an estimated budget and note.
8. The user reviews an explanatory summary of what remains undecided.
9. The user publishes the intention.
10. Matching subscribers near the location may be notified.

### 7.2 Express interest

1. A user opens a buying-intention post.
2. The interface displays the creator, approximate location, timing, current interest, and decided/undecided fields.
3. The user selects **I’m interested**.
4. The user may optionally add their preferred quantity, budget range, or note.
5. The creator and existing interested members are notified.
6. The user gains access to the group room.

### 7.3 Plan as a group

1. Group members discuss requirements.
2. Members add suggestions for vendors, prices, dates, and fulfilment.
3. Structured checklist items show which decisions remain open.
4. A permitted member prepares a final plan.
5. The group reviews the plan.
6. Each required member confirms or declines.
7. If someone declines, the plan returns to planning or the group seeks another member.

### 7.4 Complete the purchase

1. A confirmed group proceeds using the agreed external payment and fulfilment arrangement.
2. A coordinator marks the purchase ready for completion.
3. Required members acknowledge completion or report a problem.
4. The group is marked completed when the completion rule is satisfied.
5. Members can leave private feedback and safety reports.

### 7.5 Create an available share

1. An authenticated user selects **Create**.
2. The user chooses **I have a share available**.
3. The user supplies the required product, portion, price, location, date, and media.
4. The interface clearly identifies the post as an available share rather than an intention.
5. Interested users select **Request this share**.
6. The seller can review requests and begin a group or direct coordination flow supported by the pilot.

## 8. Functional requirements

### 8.1 Authentication and onboarding

#### Requirements

- Users can register and sign in using a supported Nigerian phone number.
- The system verifies possession of the number.
- Users provide a display name.
- Users choose a home discovery location.
- Users select categories for optional alerts.
- Users accept current terms and privacy notice.
- Users can sign out and request account deletion.

#### Acceptance criteria

- An unverified phone number cannot publish or express interest.
- A user can browse a limited public experience before registration if pilot policy permits.
- A user’s phone number is not displayed publicly.
- Consent records retain the accepted policy version and time.

### 8.2 User profile

#### Public profile information

- Display name
- Profile image or initials
- Approximate location
- Verification labels with explanations
- Number of completed groups
- Member-since date
- Aggregate feedback when sufficient data exists

#### Private profile information

- Phone number
- Notification preferences
- Saved locations
- Reports and enforcement history
- Identity-review information, if introduced

### 8.3 Public wall

#### Requirements

- Display active buying intentions and available shares.
- Prioritise relevance by location, category, recency, and status.
- Clearly label post type.
- Show human-readable intent language.
- Support search and filters.
- Exclude closed, expired, removed, and blocked content.

#### Minimum card content for buying intentions

- Creator identity
- Product
- Approximate location
- Desired timing
- Desired share or Flexible
- Number of interested people
- Current state
- **I’m interested** action

#### Minimum card content for available shares

- Seller identity
- Product
- Available quantity or percentage
- Price
- Approximate location
- Availability deadline
- Verification label, if applicable
- **Request this share** action

### 8.4 Search and filters

The pilot should support:

- free-text product search;
- category;
- post type;
- town or neighbourhood;
- distance band when reliable location data is available;
- preferred date range;
- active status; and
- share or quantity where category data permits.

The product must remain usable when a user denies precise location access. Manual town selection is required.

### 8.5 Create buying intention

#### Required fields

- Category
- Product title
- Approximate location
- Desired date or Flexible
- Desired share/quantity or Flexible
- Short description

#### Optional fields

- Estimated total budget
- Estimated personal budget
- Preferred number of participants
- Reference images
- Existing vendor suggestion
- Processing, packaging, pickup, or delivery preference
- Expiry date

#### Validation

- The UI must not label an estimate as a confirmed price.
- Unsupported or prohibited categories cannot be published.
- Public text is subject to moderation controls.
- Exact home addresses must not be requested in the public form.
- A post must have a defined expiry, either user-selected or system-defaulted.

### 8.6 Interest management

- A user can show interest once per active post.
- A user can update their interest note and preferences.
- A user can withdraw before final-plan confirmation.
- The creator cannot prevent a valid user from seeing the public post.
- Pilot policy may allow the creator or administrator to remove a participant from a group for documented safety or relevance reasons.
- Interest counts update without requiring a full page reload.
- Withdrawn users stop receiving group updates unless they opt to watch the post.

### 8.7 Group room

#### Contents

- Original post summary
- Creator and interested-member list
- Member status: interested, ready, confirmed, withdrawn, removed
- Conversation or update thread
- Structured decision checklist
- Suggestions and supporting links or images
- Final-plan area
- Leave, mute, block, and report actions

#### MVP decision checklist

- Product specification
- Number of participating portions
- Portion allocation
- Vendor or seller
- Total product price
- Additional costs
- Amount per member
- Purchase date
- Processing or packaging
- Pickup or distribution point
- Coordinator

Each item may be **Not discussed**, **Discussing**, **Suggested**, or **Agreed**.

### 8.8 Suggestions and decisions

- Members can suggest values for checklist items.
- Suggestions identify the author and time.
- Members can support, question, or reject a suggestion.
- An agreed label in the planning room is informational until captured in a final plan.
- The system retains previous final-plan versions for audit and dispute support.

### 8.9 Final plan

#### Required fields before proposal

- Product specification
- Required participants or portions
- Allocation per required participant
- Total price or clear method for calculating it
- Amount expected from each participant
- Vendor or seller identity, where applicable
- Purchase date or defined window
- Fulfilment method
- Coordinator

#### Confirmation rules

- The plan shows a readable summary before confirmation.
- Members explicitly choose **Confirm participation** or **Decline plan**.
- Confirmation records the plan version and time.
- Editing a material term invalidates previous confirmations.
- A group cannot become Confirmed until its required confirmation rule is met.
- The MVP default is confirmation by every member assigned a portion.
- Interested observers who are not assigned a portion are not required to confirm.

### 8.10 Notifications

#### Discovery notifications

- New relevant intention near a chosen location
- New available share matching a category preference

#### Activity notifications

- Someone expressed interest in the user’s post
- A member withdrew
- A new suggestion was added
- A checklist item changed
- A final plan was proposed
- A final plan changed
- A member confirmed or declined
- The group reached Confirmed status
- A purchase was marked ready for completion
- A report or administrative action requires attention

#### Controls

- Users can enable or disable discovery notifications by category and location.
- Users can mute a group while preserving essential safety and plan-change notices.
- Notification links open the relevant content.
- Notification messages avoid revealing sensitive details on a locked device where practical.

### 8.11 Sharing and invitations

- Every active public post has a shareable link.
- The interface provides a WhatsApp share action.
- Shared previews contain the product, approximate location, timing, and KAJORA attribution.
- Private group content does not appear in public link previews.
- Opening a shared link takes the user to the relevant post, with onboarding if required.

### 8.12 Completion

- Only a confirmed group can enter completion flow.
- A coordinator can mark the purchase as completed or ready for member acknowledgement.
- Members can confirm completion, state that they did not participate, or report a problem.
- The completion rule must be visible.
- Administrators can correct a status with an auditable reason.

### 8.13 Feedback

After completion, members may provide:

- whether the purchase occurred;
- whether the result matched the final plan;
- private operational feedback;
- member conduct feedback; and
- a report requiring review.

Public ratings should not launch until there is enough data and an appeal process.

### 8.14 Reporting and moderation

Users can report:

- misleading information;
- suspected fraud;
- abusive conduct;
- prohibited products;
- privacy violations;
- unsafe fulfilment;
- duplicate or spam content; and
- another specified concern.

Administrators can:

- review reports;
- request information;
- hide or remove a post;
- remove a member from a group;
- restrict publishing or participation;
- suspend an account;
- add internal notes;
- reverse an action where appropriate; and
- see an audit trail.

Enforcement actions require a reason. Users should receive an understandable notice unless doing so would create a safety or investigation risk.

## 9. State models

### 9.1 Buying-intention post states

| State | Entry condition | Permitted next states |
| --- | --- | --- |
| Draft | Creator has not published | Open, Deleted |
| Open | Published and accepting interest | Forming, Planning, Closed, Expired, Removed |
| Forming | At least one person is interested | Open, Planning, Closed, Expired, Removed |
| Planning | Group is actively discussing details | Awaiting confirmation, Closed, Expired, Removed |
| Awaiting confirmation | A final plan has been proposed | Planning, Confirmed, Closed, Removed |
| Confirmed | Required members confirmed current plan | Planning, Completed, Closed, Removed |
| Completed | Completion rule satisfied | Reopened by administrator only |
| Closed | Creator or administrator ended the process | Reopened when policy allows |
| Expired | Expiry time passed | Reopened or Closed |
| Removed | Administrative moderation action | Restored by administrator only |

### 9.2 Participant states

| State | Meaning |
| --- | --- |
| Interested | User joined the planning context without commitment |
| Ready | User indicates readiness for a final plan |
| Assigned | A portion is assigned in a proposed plan |
| Confirmed | User confirmed the current final-plan version |
| Declined | User declined the current final-plan version |
| Withdrawn | User voluntarily left before completion |
| Removed | User was removed under a recorded policy reason |
| Completed | User acknowledges participation in the completed purchase |

### 9.3 Available-share states

| State | Meaning |
| --- | --- |
| Draft | Not public |
| Available | Public and accepting requests |
| Partially allocated | Some quantity has been assigned |
| Fully allocated | All offered quantity has been assigned |
| Completed | Seller and applicable participants report completion |
| Expired | Deadline passed |
| Closed | Seller ended the offer |
| Removed | Administrative action |

## 10. Permissions summary

| Action | Visitor | Member | Creator | Coordinator | Admin |
| --- | ---: | ---: | ---: | ---: | ---: |
| View active public posts | Limited | Yes | Yes | Yes | Yes |
| Create post | No | Yes | Yes | Yes | Yes |
| Express interest | No | Yes | Yes, except own post | Yes | Yes |
| Enter joined group room | No | Yes | Yes | Yes | Yes |
| Add suggestion | No | Group only | Group only | Group only | As support |
| Propose final plan | No | Policy-dependent | Yes | Yes | As support |
| Confirm own participation | No | Yes | Yes | Yes | No proxy confirmation |
| Moderate content | No | No | Own post controls only | Limited group controls | Yes |
| Change another user’s confirmation | No | No | No | No | No; status correction is separately audited |

## 11. Data model outline

The logical model should include at least:

### User

- id
- phone verification state
- display name
- profile image
- discovery locations
- notification preferences
- verification claims
- account state
- timestamps

### Post

- id
- type: buying intention or available share
- creator id
- category and product label
- description
- desired or available quantity
- price fields with estimate/confirmed semantics
- approximate location
- preferred date or deadline
- visibility
- lifecycle state
- expiry
- timestamps

### Interest

- id
- post id
- user id
- desired quantity or share
- budget preference
- note
- participant state
- timestamps

### Group

- id
- source post id
- creator id
- coordinator id
- lifecycle state
- required confirmation rule
- timestamps

### Group membership

- group id
- user id
- role
- participant state
- mute state
- joined and left timestamps

### Message or update

- id
- group id
- author id
- type
- content
- media
- moderation state
- timestamps

### Decision item

- id
- group id
- decision type
- current planning state
- suggestions
- timestamps

### Final plan and plan member

- plan id and version
- group id
- product specification
- vendor details
- cost breakdown
- allocation breakdown
- schedule
- fulfilment method
- coordinator
- member confirmation records
- status and timestamps

### Notification

- id
- recipient id
- type
- related entity
- read state
- delivery channels
- timestamps

### Report and moderation action

- reporter and subject references
- category
- evidence
- status
- assigned administrator
- actions
- internal and user-visible notes
- timestamps

All state-changing records should preserve who performed the action and when.

## 12. Privacy and safety requirements

- Do not display phone numbers publicly.
- Do not require exact residential addresses on public posts.
- Separate public location from private fulfilment location.
- Let users block another user.
- Prevent blocked users from directly interacting where feasible.
- Strip unnecessary metadata from uploaded media.
- Provide account deletion and data-retention handling.
- Rate-limit account verification, publishing, interest, messaging, and reporting actions.
- Preserve moderation evidence according to an approved retention policy.
- Display safety guidance before high-value or in-person coordination.
- Do not imply that KAJORA has inspected an animal, product, vendor, or location unless it actually has.

## 13. Content and language

### 13.1 Voice

KAJORA should sound calm, direct, and neighbourly. Avoid corporate, financial, or overly promotional language.

Preferred:

- “What do you want to buy with others?”
- “I’m interested”
- “Four people are interested”
- “The final price has not been agreed”
- “Review the group plan”

Avoid:

- “Investment opportunity”
- “Guaranteed savings”
- “Your order is secured” before an actual agreement
- “Buy now” on a buying intention
- “Verified product” without inspection

### 13.2 Terminology

| Internal term | Preferred user-facing term |
| --- | --- |
| Buying-intention post | Looking for people to buy with |
| Interest record | Interested |
| Group entity | Group |
| Decision item | Group decision |
| Final plan | Group plan |
| Available-share post | Share available |

### 13.3 Language expansion

The MVP may launch in English while preserving a content model that can support Yoruba and Nigerian Pidgin. Text should not be embedded in images, and interface layouts must tolerate longer translations.

## 14. Design requirements

- Mobile-first and responsive
- Calm visual hierarchy
- One primary action per screen
- Large enough touch targets
- Accessible contrast
- Clear focus and error states
- Plain-language validation
- Distinct visual treatment for estimated and confirmed information
- Consistent status labels
- Limited image use
- Useful empty, loading, offline, and error states
- Support for reduced motion
- Avoid colour as the sole status indicator

### Initial visual system

- Warm ivory background
- Deep moss green primary
- Charcoal text
- Pale sage surfaces
- Restrained muted-earth accent
- Humanist sans-serif typography
- Modest corner radii
- Minimal shadows
- Authentic photography

## 15. Non-functional requirements

### Performance

- Prioritise fast initial rendering on mobile networks.
- Optimise and responsively serve uploaded images.
- Paginate or progressively load the public wall.
- Avoid blocking the core experience on nonessential integrations.

### Reliability

- State transitions must be validated server-side.
- Confirmation actions must be idempotent.
- A plan version cannot change after a user confirms it; edits create a new version.
- Notification failure must not corrupt the source action.
- Administrative actions require audit records.

### Accessibility

- Target WCAG 2.2 AA where applicable.
- Support keyboard navigation.
- Associate form fields with visible labels.
- Provide meaningful alternative text for relevant images.
- Announce important dynamic state changes to assistive technology.

### Security

- Apply least-privilege authorization.
- Validate all user-generated input.
- Protect authentication and session flows.
- Rate-limit sensitive operations.
- Keep secrets out of client applications.
- Log security-relevant events without logging unnecessary personal data.

### Observability

- Record product events required for pilot metrics.
- Monitor error rates and notification delivery.
- Preserve correlation identifiers for support investigations.
- Separate product analytics from sensitive message content.

## 16. Analytics events

The MVP should capture, subject to privacy review:

- onboarding_started
- onboarding_completed
- discovery_location_selected
- post_creation_started
- post_published
- post_viewed
- interest_expressed
- interest_withdrawn
- group_opened
- suggestion_added
- decision_state_changed
- final_plan_proposed
- final_plan_confirmed
- final_plan_declined
- group_confirmed
- completion_started
- completion_acknowledged
- report_submitted
- post_shared
- notification_opened

Events should contain only the properties necessary to answer defined product questions.

## 17. Pilot metrics

### Activation

- Percentage of registered users who view a relevant post
- Percentage who publish a post or express interest
- Time from registration to first meaningful action

### Matching

- Percentage of posts receiving interest
- Median time to first interest
- Average number of interested people per post
- Match rate by category and location

### Group progression

- Percentage of groups entering Planning
- Percentage receiving a final plan
- Median time from first interest to final-plan proposal
- Confirmation rate
- Withdrawal and decline rate

### Outcome

- Confirmed groups marked completed
- Time from confirmation to completion
- Repeat participation
- Reports per active group
- Member-reported plan accuracy

The north-star pilot outcome is **completed shared purchases originating from buying intentions**.

## 18. Administrative pilot operations

The first pilot should be supervised. Administrators need operational views for:

- newly published posts;
- rapidly growing or high-value groups;
- reports awaiting review;
- users with repeated enforcement signals;
- groups awaiting confirmation for an unusual duration;
- confirmed groups approaching their purchase date; and
- recently completed groups awaiting feedback.

The product must not depend on administrators manually completing normal user actions, but the pilot should allow support intervention with auditability.

## 19. Edge cases

The design and implementation must address:

- A creator withdraws after several people express interest.
- Interested people want incompatible portion sizes.
- The desired number of participants changes.
- A vendor changes the price.
- A confirmed participant withdraws.
- A final plan is edited after some confirmations.
- The group finds a seller with only part of the required quantity.
- Two similar groups want to merge.
- A post receives no interest before expiry.
- A user repeatedly expresses and withdraws interest.
- A member blocks another member in the same group.
- A product or conversation is reported during planning.
- Group members complete a purchase without using the final-plan feature.
- The creator is no longer able to coordinate.
- Location information becomes unsafe to share.
- Connectivity fails during confirmation.

Not every edge case requires automation in the MVP. Where automation is absent, the interface must provide a safe manual path and clear status.

## 20. MVP release criteria

The supervised pilot is ready only when:

- users can register and manage a basic profile;
- users can create and discover both post types;
- users can express and withdraw interest;
- group rooms and member states function correctly;
- the decision checklist and final-plan versioning work;
- confirmations cannot silently survive a material plan edit;
- required notifications are reliable;
- public and private location data are separated;
- reporting, blocking, and administrator moderation are available;
- essential analytics events are captured;
- core flows meet accessibility and mobile performance expectations;
- operational policies for reports, closures, privacy, and support exist; and
- a small end-to-end pilot has been completed with test users.

## 21. Open product decisions

The following require founder validation or user research before implementation is finalised:

1. Should every interested person immediately enter the group room, or should very large groups use a waiting area?
2. When should an Open group visibly become Planning?
3. Who may propose the first final plan: creator, elected coordinator, or any member?
4. Can a group formally vote to replace its coordinator?
5. Should group chat be real-time, threaded updates, or a lightweight hybrid?
6. What default expiry should apply to intentions?
7. Should nearby discovery use fixed towns, distance bands, or both?
8. What information is required for an available-share seller during the pilot?
9. What confirmation threshold applies when more people are interested than receive portions?
10. How should two compatible intention groups merge?
11. What minimum support hours and escalation path will the pilot provide?
12. Which categories or products are prohibited at launch?

## 22. Recommended next steps

1. Review and approve this product model.
2. Interview potential livestock sharers, bulk-food buyers, butchers, and wholesalers.
3. Resolve the open product decisions needed for the prototype.
4. Produce screen-level user flows and low-fidelity wireframes.
5. Create the KAJORA design system and clickable prototype.
6. Select the technical architecture and record the decision.
7. Define the database schema and API contract.
8. Build the MVP in vertical slices.
9. Conduct a supervised Osogbo pilot.
10. Use pilot evidence to decide when to add payments, stronger verification, or fulfilment integrations.

