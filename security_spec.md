# Security Specification & Test Cases

## 1. Data Invariants
1. `UserProfile`: Users may only write or update their own user profile document (`users/{userId}` where `userId == request.auth.uid`). No spoofing.
2. `EncryptedChatMessage`: `senderId` in incoming data must strictly match `request.auth.uid`. No user can forge messages from another peer.
3. `SignalingPayload`: `senderId` in incoming signal must strictly match `request.auth.uid`.
4. `ScreenshotAlert`: `senderId` must strictly match `request.auth.uid`.
5. Global Safety Net: All undefined paths default to deny (`allow read, write: if false;`).

## 2. The Dirty Dozen Payloads (All MUST be rejected with PERMISSION_DENIED)
1. Anonymous unauthenticated write to `/users/user1`.
2. User 2 attempting to overwrite `/users/user1`.
3. User 1 writing a message with `senderId: "user2"` (Identity Spoofing).
4. Writing a message with extra shadow field `isAdmin: true` (Ghost Field Injection).
5. Injecting a 2.5MB payload string exceeding `maxLength: 2000000` (Denial of Wallet).
6. Non-string `type` (e.g. `type: 12345`) (Type Violation).
7. Invalid document ID containing injection symbols `../hack` (ID Poisoning).
8. Modifying an immutable field like `createdAt` during message update.
9. Signal with forged `senderId` to hijack WebRTC session.
10. Unauthenticated read of conversation signals.
11. User trying to write to `/conversations/{conversationId}` root document without permissions.
12. Updating someone else's screenshot alert.
