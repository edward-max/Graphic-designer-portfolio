# Security Specification — Koby Portfolio & CMS

## 1. Data Invariants
1. **Default Deny**: All unspecified paths under `/databases/{database}/documents` are denied by default.
2. **Admin Privilege Integrity**: Only the bootstrapped verified admin (`request.auth.token.email == 'eddykoby64@gmail.com' && request.auth.token.email_verified == true`) or an existing `/admins/{uid}` record grants admin privileges. Clients cannot write to `/admins`.
3. **Public vs. PII Separation**: `/projects`, `/testimonials`, and `/settings/main` are publicly readable portfolio content, writable only by verified admins. `/inquiries` contains visitor PII (name, email, message) and is strictly write-once (`create`) for visitors and readable/deletable ONLY by verified admins.
4. **Strict Payload Blueprints & Bounds**: Every document enforces exact key allowlists (`hasAll` + `hasOnly`), string `.size()` ceilings, bounded lists (`gallery_images <= 12`, `tools <= 20`), and server-enforced `request.time` timestamps.
5. **Immutable Identity & Creation Timestamps**: Document `id` and `createdAt` cannot be altered on update, and every `update` validates `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Project Creation**: Anonymous visitor sends `POST` to `/projects/proj-x` -> Denied by `isAdmin()`.
2. **Unverified Admin Email Spoof**: User with `email: 'eddykoby64@gmail.com'` and `email_verified: false` attempts `/projects` write -> Denied by `email_verified == true`.
3. **Self-Assigned Admin Escalation**: Authenticated user writes `{ uid: auth.uid, email: 'attacker@evil.com' }` to `/admins/{uid}` -> Denied by `allow write: if false`.
4. **Shadow Field Injection on Project**: Admin sends valid project payload plus `{ isVerified: true, extra: "shadow" }` -> Denied by `hasOnly(...)`.
5. **Path ID Poisoning**: Admin creates `/projects/bad..id$with!chars` or 500-char ID -> Denied by `isValidId(projectId)`.
6. **Project Title / Description Resource Exhaustion (DoW)**: Admin sends 10,000-character `description` (> 2000 limit) -> Denied by `isValidProject`.
7. **Unbounded Gallery Array Poisoning**: Admin sends 20 items in `gallery_images` (> 12 limit) or non-string element `[123]` -> Denied by `gallery_images.size() <= 12` and element check.
8. **Client-Forged Timestamp**: Visitor or admin sends client date instead of `serverTimestamp()` for `createdAt` -> Denied by `createdAt == request.time`.
9. **Immutable `createdAt` Mutation on Update**: Admin updates a project and alters `createdAt` -> Denied by `incoming().createdAt == existing().createdAt` & `affectedKeys().hasOnly(...)`.
10. **PII Leak via Inquiry Get**: Non-admin authenticated user attempts `get` on `/inquiries/inq-1` -> Denied by `isAdmin()`.
11. **PII Scrape via Inquiry List**: Non-admin authenticated user attempts `list` on `/inquiries` -> Denied by `isAdmin()`.
12. **Inquiry Tampering / Update**: Visitor or non-admin attempts `update` or `delete` on `/inquiries/inq-1` -> Denied by `allow update: if false` and `allow delete: if isAdmin()`.
