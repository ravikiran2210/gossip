# Architecture Decision Record

## ADR-001: In-Memory Socket.IO Registry (MVP)

**Status:** Accepted (MVP only)

**Context:** Free Render tier provides a single instance. Multiple instances would require a shared pub/sub layer.

**Decision:** Use in-memory `Map<userId, Set<socketId>>` for the MVP.

**Consequence:** Does not support horizontal scaling. When upgrading to paid hosting with multiple instances, add `@socket.io/redis-adapter`.

**TODO in code:** `apps/backend/src/realtime/connection-registry.ts`

---

## ADR-002: encryptedPayload — Plaintext Now, E2EE Later

**Status:** Accepted (MVP)

**Context:** True E2EE requires key exchange infrastructure not ready for MVP.

**Decision:** Store message content in `encryptedPayload` field as plaintext. Field name and `EncryptionService` abstraction are in place so the swap is a single-file change.

**Consequence:** Messages are readable at the database level. Not suitable for production privacy use until E2EE is implemented.

---

## ADR-003: Separate JWT Strategies for Admin and User

**Status:** Accepted

**Context:** Admin and user roles must not cross-authenticate. An admin token must not access user endpoints and vice versa.

**Decision:** Two separate Passport strategies (`admin-jwt`, `user-jwt`), each checking the `type` claim in the JWT payload. Two separate guards.

---

## ADR-004: directKey for Deduplicating Direct Conversations

**Status:** Accepted

**Context:** Starting a direct chat twice would create duplicate conversations.

**Decision:** Sort two user IDs and join with `:` to create a deterministic `directKey`. Index as unique sparse. `POST /conversations/direct` returns the existing conversation if the key exists.

---

## ADR-005: Client-Generated Message IDs (UUID)

**Status:** Accepted

**Context:** Optimistic UI requires local message tracking before server confirmation.

**Decision:** Client generates a UUID v4 as `messageId` before sending. Backend deduplicates on this field (unique index). Safe to retry on network failure.

---

## ADR-006: IndexedDB as Primary Read Source for Chat UI

**Status:** Accepted

**Context:** Chat UI should not flash-load or depend on network availability.

**Decision:** Chat store reads from Dexie (IndexedDB) first, then updates from API/socket. This provides instant load from cache and graceful offline behavior. Full offline queue is deferred (placeholder `pendingQueue` table exists).

---

## ADR-007: Access Codes Stored as bcrypt Hashes

**Status:** Accepted

**Context:** Access codes must be single-use, expiring, and must not be readable even if the database is compromised.

**Decision:** Generate random 12-char code. Hash with bcrypt. Store only the hash. Return raw code to admin exactly once. Admin dashboard shows the code for copy-paste, then it's gone from the UI.

**Trade-off:** bcrypt verification requires scanning all active codes (no indexed lookup possible). For MVP volume (low hundreds of active codes) this is acceptable. At scale, switch to HMAC-SHA256 with a server-side secret for fast keyed lookup.
