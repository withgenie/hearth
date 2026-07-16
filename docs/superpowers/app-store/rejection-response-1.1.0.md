# App Review rejection response — Hearth 1.1.0 (build 14)

Submission ID: `42617e83-af27-4fb6-8bf0-fe42b028e23c`

```text
Hello App Review,

Thank you for the detailed review. We addressed all three issues in Hearth
1.1.0 build 14.

Guideline 5 — Legal
We removed China mainland from the app's availability. Hearth's optional
OpenAI integration and all related metadata are now distributed only outside
China mainland, as suggested in your message.

Guideline 2.1(a) — App Completeness
Build 13 accidentally exposed an unfinished, non-functional License settings
placeholder. It did not perform a network or StoreKit request and could only
remain on "Loading license status." Build 14 removes the entire License tab and
all related loading, trial, product ID, purchase, and restore UI.

Guideline 2.1(b) — In-App Purchases
Hearth is a paid-upfront Mac app. It has no In-App Purchase products,
subscriptions, trial gate, or separate unlock. App Store Connect currently
contains zero In-App Purchase products for Hearth. The build 13 placeholder
incorrectly referenced the unshipped product ID `io.hearth.app.pro`; that
reference and the Buy/Restore controls are absent from build 14. Therefore
there is no IAP product to submit for review.

Verification
1. Install Hearth 1.1.0 build 14.
2. Open Settings.
3. The visible tabs are General, Theme, AI, Backup/Import, Categories,
   Integrations, and About. There is no License tab or license-loading state.
4. Core project, memo, and calendar features work without a login, API key,
   entitlement lookup, or purchase gate.

The optional OpenAI integration requires a user-provided API key and may be
skipped during review. It is not required for any core app feature.

Thank you.
```
