# BloodBank Nankana

Native Kotlin/Jetpack Compose Android application and Firebase backend for verified blood donation and requests in Nankana Sahib, Punjab. It uses Firebase Authentication, Firestore, Cloud Messaging, Cloud Functions and App Check; it deliberately contains **no Firebase Storage dependency, storage rules, or file-upload workflow**.

## Android Gradle configuration

The repository root [`build.gradle.kts`](build.gradle.kts) applies the Android, Kotlin/Compose and Google services plugins with `apply false`. [`app/build.gradle.kts`](app/build.gradle.kts) applies Google services at application scope and uses the Firebase Android BoM `34.18.0` without versioning individual Firebase libraries.

## Security model

- Phone OTP uses Firebase Phone Authentication and profiles retain only a SHA-256 CNIC digest; raw CNIC values do not leave the profile form.
- Firestore rules require Firebase Authentication, prevent clients from writing verification and account-role fields, and enforce custom-claim roles for privileged data changes.
- App Check is initialized with Play Integrity; callable Functions enforce App Check and authenticate every privileged caller.
- Callable functions set role claims, review donor verification, send emergency alerts, sanitize text and apply a 15-minute emergency rate limit.
- Contact information is intentionally not included in donor discovery documents; request acceptance/contact release must remain a Cloud Function-mediated server workflow before public release.

## Manual release setup (in order)

1. Create a Firebase project in the Firebase Console and register Android package `com.ishark.bloodbanknankana`; download its `google-services.json` to `app/` locally. Do not commit it.
2. Enable Authentication providers **Phone** (complete Android SHA-1/SHA-256 and reCAPTCHA setup) and **Email/Password**; configure authorized domains and test real Pakistani `+92` phone verification.
3. Create a production Firestore database in the required region. Deploy rules and indexes with `firebase deploy --only firestore`.
4. Install function dependencies in `functions/`, then deploy with `firebase deploy --only functions`. Use the Firebase Console or Admin SDK only to assign the first account a `superadmin` custom claim.
5. Enable Cloud Messaging and configure Android notification permission behaviour. Confirm the project’s FCM sender configuration is present in `google-services.json`.
6. Enable Firebase App Check with Play Integrity, register Play Console SHA-256 certificates, and enforce App Check for Firestore, Authentication where supported, and Cloud Functions after monitored rollout.
7. Seed only verified hospital records through an admin account, including a real address, public phone number and stock status only when confirmed by that facility.
8. Configure a privacy policy covering CNIC hashing, identity verification, location, notifications, retention and account deletion; expose a support route before Play submission.
9. Create a signed Android App Bundle with your release keystore, complete Play Console Data safety, content rating, privacy-policy and testing tracks, then test OTP, App Check, emergency rate limiting and rule-denied paths with real accounts before production rollout.
