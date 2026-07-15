---
field: review-notes
locale: en
char_limit: n/a
release: 1.1.0
---

```
=== Review Notes for Hearth 1.1.0 ===

Thank you for reviewing Hearth.

1. PURCHASE MODEL
   Hearth is a paid-upfront Mac app. Version 1.1.0 contains no In-App
   Purchases, subscriptions, trial gate, or separate account sign-in.

2. APP OVERVIEW
   Hearth is a local-first workspace for projects, memos, and schedules.
   User data is stored in a local SQLite database. Hearth has no analytics,
   user account, or Hearth-operated server.

3. KEY FLOWS TO TEST
   a) Calendar and rescheduling
      - Open Calendar from the sidebar.
      - Drag any schedule chip to another date.
      - The chip preview follows the pointer and its date changes on drop.
      - Click a date to open the day panel and edit schedules and memos.

   b) Journal and instant capture
      - Open Memos, then choose Journal.
      - Enter text in the top quick input and press Return.
      - The memo appears under today's date.

   c) Quick Capture
      - From any app, press Control-Shift-H.
      - Enter text and press Return to save; press Escape to cancel.
      - The shortcut can be changed in Settings > General.

   d) Projects and themes
      - Open Projects to review priority-based cards and compact rows.
      - Open Settings > Theme to switch among ten presets or use a custom
        accent. The Calendar and Journal update immediately.

4. OPTIONAL FEATURES
   - OpenAI: opt-in and requires the reviewer's own API key. Core features do
     not require AI and this integration may be skipped during review.
   - The optional `hearth` CLI and agent skill are distributed separately and
     are not required to review the Mac App Store binary.

5. PRIVACY
   Privacy Label: Data Not Collected.
   Privacy Policy: https://hearth.codewithgenie.com/en/privacy

6. CONTACT
   Developer: Jaehyun Jang / WithGenie
   Email: support@codewithgenie.com
   Response time: within 48 business hours (KST).
```
