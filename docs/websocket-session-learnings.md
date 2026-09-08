# WebSocket Session Learnings

Personal session journal: realtime WebSocket development for the Slack clone backend.
Update this file as new sessions add decisions, features, and debugging lessons.

---

## 1. Working Agreement (the build loop)

- **User implements** the feature code; **agent reviews/points out bugs**, writes gate tests, and fixes only when explicitly told.
- Loop: implement → review → fix → gate tests → `npm run type-check` + `npm test` green.
- When the user says a specific word like **"go"**, the agent may implement; otherwise agent stays in review/plan mode and waits.

## 2. Hard Directives (do not violate)

1. **Do NOT rename existing event values.** They stay long and explicit:
   `channel.message.create/created/update/updated/delete/deleted` and
   `conversation.message.*`. New events may be *added*, never renamed.
2. **Payloads ride in the `data` field** of `WsResponse`, never double-stringified in `message`.
3. **Upload cap = 3** attachments (`upload.route.ts` → `.array("attachments", 3)`).
4. **One workspace per connection** — a socket registers presence for exactly one workspace; switching workspaces moves it.

## 3. Protocol Contracts

### Envelope (client → server)
```json
{ "type": "<WsEvent>", "payload": { ... } }
```
Parsed by `parseEnvelope` (`schema/envelope.ts`), `type` validated against `WsEvent`.

### WsResponse (server → client)
```ts
type WsResponse = {
  type: WsEvent;          // request event type by convention (same type in + out)
  success: boolean;
  statusCode: number;
  message?: string;
  error?: WsErrorBody;    // { code, message }
  data?: unknown;         // always use for payloads
}
```
Factory: `WsResponse.ok(type, message = "OK", statusCode = OK, data?)`,
`WsResponse.fail(type, statusCode, code, errorMessage)`.

### Current events (`src/websockets/types/events.ts`)
- `conversation.subscribe/.unsubscribe`
- `channel.subscribe/.unsubscribe`
- `conversation.message.create/.created/.update/.updated/.delete/.deleted/.reaction`
- `channel.message.create/.created/.update/.updated/.delete/.deleted/.reaction`
- `typing.start/.stop`
- `presence.update`
- `ping/.pong`, `error`

### Broadcast convention
Reply to publisher **and** broadcast to entity subscribers **excluding the sender**.
Broadcast ack data = `{ userId, ... }` (who did it + what was sent).

## 4. Architecture Tenets (every handler)

1. **`this`-free handlers or bound registration.** `eventRouter.dispatch` invokes stored
   handlers as bare `handler(ws, message)` — **unbound methods using `this` CRASH**. Two safe
   patterns:
   - Module-scope helpers, thin exported object (`typingHandler`, `reactionHandler`).
   - Class methods registered **bound**: `presenceHandler.registerConnection.bind(presenceHandler)`.
2. **Guard order in every handler:** authenticate (`UNAUTHORIZED`) → validate payload
   (`VALIDATION_ERROR` / `BAD_REQUEST`) → workspace membership, then entity membership
   (`FORBIDDEN`) → act → reply → broadcast.
3. **Scope is resolved from the DB**, not trusted from the payload:
   - Channel messages → `post.channelId`, membership via `channelRepository.memberExists(wm.id, channelId)`.
   - Conversation messages → `post.conversationId`, membership via `conversationRepository.conversationExists(convoId, userId)`.
   - The message record (`messageRepository.messageExists`) carries `channelId`/`conversationId`/`deletedAt`.
4. **Reject-but-don't-mutate:** on every failure path assert the mutation was NOT called
   (gate tests check `expect(mutation).not.toHaveBeenCalled()`).
5. **`data` payload for acks;** failures reply with `message.type` (not a hardcoded event).

## 5. Feature Reference

### Message update/delete (channels + conversations)
- Router routes conversation update/delete to `conversationHandler` (not `messageHandler`).
- Channel guard: `!post.channelId`; conversation guard: `post.conversationId !== payload.conversationId`.
- Single delete frame (no duplicate send); delete success = OK + `{ messageId }` in `data`, still broadcast.
- Update + delete schemas use `.trim()` + non-empty `refine`.

### Typing indicators
- `typingHandler` = module-scope `forwardTyping(ws, entityId, entityType)` used by both `typingStart`/`typingStop` (no `this`).
- Payload: `{ workspaceId, entityId, entityType: "channel" | "conversation" }`.
- Broadcast `{ userId, entityId }` to subscribers excluding sender; silent no-op when no subscribers.
- Both `TypingStart` and `TypingStop` registered (watch that you don't overwrite one with the other).

### Reactions
- Events: `channel.message.reaction` / `conversation.message.reaction`, routed to one
  `reactionHandler.react` (no `this`).
- Schema: `{ workspaceId, messageId, reaction: exactly-one-emoji }` (`emoji-regex`).
- Toggle semantics:
  - no existing → `addReaction` → `action: "added"`
  - same emoji → `toggleReaction` (delete) → `action: "removed"`
  - different emoji → delete old + `addReaction` new → `action: "added"`
- Broadcast data `{ userId, messageId, reaction, action }` lets the client fully reconcile.
- Anyone can react (no sender restriction). Note DB unique constraint `userId_messageId_emoji`.

### Presence
- Data model (`presenceManager.ts`):
  - `currentWorkspace: Map<WebSocket, workspaceId>` (ws → workspace)
  - `userConnections: Map<workspaceId, Set<WebSocket>>` (workspace → sockets)
  - `userId`/`username` **derived** from `connectionManager.getMetadata`, never stored twice.
- Protocol (`presence.update`, payload `{ workspaceId }`):
  - **Reply to publisher** (roster bootstrap): `data: { workspaceId, online: [{ userId, username }] }`, deduped by userId.
  - **Online broadcast** to other online members, sender excluded:
    `data: { workspaceId, userId, username, status: "online" }`.
  - **Offline broadcast**: `data: { workspaceId, userId, username, status: "offline" }`.
- Registration flow: auth → validate → `memberExists` (FORBIDDEN) → move/cleanup → add socket → roster reply → online fan-out.
- **Workspace switch (A→B):** wipe the socket's channel/conversation subscriptions
  (`subscriptionManager.removeSocket(ws)`) — client resubscribes to B. Old workspace A gets
  an offline notify if the user no longer has a socket there.
- **Centralized multi-device gate (KEY DESIGN):** `notifyOffline(workspaceId, userId, username)`
  owns the gate — it only broadcasts offline `if (!isUserOnlineInWorkspace(workspaceId, userId))`.
  Both call sites (register-move path, websocketServer close path) call it **unconditionally** —
  do NOT duplicate the gate at call sites.
- **Remove-first ordering rule:** the socket must already be removed from the workspace's set
  *before* the gate runs, or the gate counts the departing socket and never announces the leave.
- `websocketServer` close path (in try/catch): capture metadata → `subscriptionManager.removeSocket(ws)`
  → `presenceHandler.removeConnection(ws)` → `connectionManager.removeConnection(ws)` → if a
  previous workspace existed, gate-driven `notifyOffline(...)`.

### Heartbeat (ping/pong)
- `heartbeatHandler.ping` (no `this`) replies `pong` unconditionally (no schema/auth — a ping always gets a pong; strict
  validation risks reconnect loops). Echoes client `timestamp` if present, plus `serverTime`.
- `EventRouter` registers `WsEvent.Ping` → `heartbeatHandler.ping` (no bind needed).
- Dead-socket detection = **lastSeen sweep**, app-level only:
  - `ConnectionMetadata.lastSeenAt` (init = `connectedAt`); `connectionManager.updateActivity(ws)` runs first in the
    `on("message")` handler (even malformed JSON keeps the socket alive).
  - `heartbeatManager` (`start(intervalMs=30_000, timeoutMs=60_000)` / `stop()` / `checkSockets(timeout)`) terminates
    sockets silent beyond the timeout. `terminate()` fires the normal close path → existing cleanup (subscriptions wipe,
    presence offline, metadata removal) — **no new cleanup logic**.
  - Started from `server.ts` after `listen` (explicit start keeps modules testable; no stray interval on test imports).
- `connectionManager` gained `getAllConnections()` (union of `userConnections`).

### Replies (postReply)
- Events `ChannelMessageReply`/`ConversationMessageReply`, single `replyHandler.reply` (no `this`) for BOTH entities —
  mirror of the reaction pattern; no client-facing reply REST anymore.
- `postReplySchema` = `{ workspaceId, parentMsgId, entityId, entityType, content, uploadIds }`. Client always sends the
  entity (`entityId` + `entityType`) — the server never guesses the entity from the message row (no `channelId`-null
  sniffing). Same for reactions (`postReactionSchema` = `{ workspaceId, entityId, entityType, parentMessageId, reaction }`).
- `createReply` in `message.repository.ts` previously only handled `ConversationMessageDTO` (channel replies returned
  `undefined`, silently broken in REST too) — now creates for both DTO shapes.
- Reply/reaction integrity: the handler still verifies `post.channelId === entityId` (or `post.conversationId === entityId`)
  so a claimed entity must actually own the message; this validates the claim without guessing the branch.

## 6. Lessons / Debug Stories

1. **Unbound `this` crash** — a class-method handler registered without binding throws inside
   `eventRouter.dispatch` (bare call). Fixed typingHandler via module-scope; presenceHandler via `.bind`.
2. **Broadcasting to the wrong audience** — offline fan-out initially used
   `subscriptionManager.getSubscribers(workspaceId)`. Nothing subscribes to a *workspace id*
   (subscriptions key on channel/conversation ids), so it was always empty → nobody notified.
   Presence fan-out must use `getOnlineSockets(workspaceId)`.
3. **`connections.add(ws)` nested in the wrong block** — the socket was only added to the
   workspace set when the set was brand-new; re-registers/moves never added it.
4. **Roster dedupe** — same user with multiple sockets must appear once in the roster.
5. **Duplicate keys in `events.ts` from a careless multi-line edit** — TS errors on duplicate
   object literal keys (`as const`). Re-read the whole file after insertion-order edits.
6. **Validation failure used `StatusCodes.OK`** and hardcoded the event — must be `BAD_REQUEST`
   and `message.type`.
7. **Gate at the wrong place** — calling the multi-device check before removing the socket
   yields a false "still online" and silently skips the offline broadcast.

## 7. Test Conventions (`tests/unit/websockets/*.test.ts`, vitest)

- `vi.mock` each repo/singleton module with named mock objects.
- Capture sends via hoisted `sentFrames` through a mocked `sendWs` in
  `websockets/utility/wsResponse` (spread the `importOriginal` real module).
- Mock `connectionManager.getMetadata` with a shared `metadataMap` keyed by socket —
  **never** a single-arg implementation, or only the last-registered socket has metadata.
- `beforeEach` → `vi.clearAllMocks()` + `sentFrames.length = 0` + `metadataMap.clear()`.
- Assert failure paths call no mutation (`expect(repo.x).not.toHaveBeenCalled()`).
- Include `eventRouter.dispatch` regression tests that would have caught unbound-`this`.
- `afterEach` → `subscriptionManager.removeSocket(ws)` (and any presence cleanup).

## 8. Repo State & Loose Ends

- **Verification:** `npm run type-check` (clean) + `npm test` (test count grows: 82 → 95 → **106** with presence → **112** with heartbeat).
- **Roadmap:** typing ✅, reactions ✅, presence ✅, heartbeat/ping-pong ✅ — all four realtime features complete.
- Stale `src/websockets/types/wsError.ts` (unused, has a `MessageDelete` entry) — candidate for deletion.
- Unrelated unstaged change in `src/server.ts`; git has staged modifications + untracked `docs/` files.
- Frontend WS client is out of scope (build artifacts only).