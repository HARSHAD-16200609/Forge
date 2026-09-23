# WebSocket Scaling — Problems, Fixes, and Final Implementation

This document records how WorkSphere scaled its realtime WebSocket layer from a
single in-process broadcast to a multi-instance Redis Pub/Sub relay, the problems
we hit along the way, and how each one was overcome. It is the companion to
`websocket-architecture.md` (structure) and `websocket-relay-architecture.html`
(the updated visual map).

---

## 1. Context

The realtime layer lives in `backend/src/websockets/` and is built around **in-process
singletons**:

- `connectionManager` — `userId -> Set<WebSocket>` plus per-socket `ConnectionMetadata` (userId, sessionId).
- `subscriptionManager` — bidirectional `socket <-> entityId` maps for scoped fan-out.
- `eventRouter` — dispatches inbound `WsEvent` to registered handlers.
- `handlers/*` — validate with Zod, persist through the repository layer, then broadcast.

Originally every broadcast site did the same thing by hand:

```ts
const subscribers = subscriptionManager.getSubscribers(entityId);
sendWs(ws, okResponse);                          // ack the sender
subscribers?.forEach((subscriber) => {
    if (subscriber !== ws) sendWs(subscriber, okResponse);   // fan-out locally
});
```

This works perfectly on one instance: every socket lives in this process, so
`getSubscribers` can reach everyone who should see the event.

## 2. The core problem

The moment you run **two or more backend instances** (horizontal scale-out,
rolling deploys, multi-region), the singletons no longer know about each other:

- A socket connected to **Node A** is invisible to `subscriptionManager` on **Node B**.
- A message created on Node B is broadcast only to B's local subscribers.
- Users on Node A never see it in realtime; they only see it after a refresh/refetch.

Options considered:

| Option | Verdict |
|---|---|
| Polling / shared DB reads | Adds latency, no push semantics, defeats the reason for WebSockets |
| Shared in-memory store per entity | Same subscription problem, no instant push |
| `socket.io`-style adapter | Would rewrite the transport layer |
| **Redis Pub/Sub relay** | Instant push, fully decoupled nodes, fits the existing push model — **chosen** |

Redis Pub/Sub is a good fit here because it is a **signal bus**, not a store: we do
not need message history or durability, we need "when node B sends X, every node
should immediately push X to its local subscribers".

---

## 3. Problems we faced, and how we overcame them

### P1 — Cross-instance delivery

**Problem.** In-process `subscribers.forEach` cannot reach sockets on other nodes.

**Fix.** A single Redis channel, `forge:relay`, carries every broadcast. The sending
node publishes a small JSON envelope; every node (including the sender) runs a
subscriber that re-fans the envelope out to its own local sockets subscribed to that
entity:

```
Node A handler --publish--> Redis(forge:relay) --subscribe--> Node A + Node B
                                        \                  \ deliverEnvelope()
                                         \                  local sockets
```

Relevant code: `relayBroadcast()` in `backend/src/websockets/relay.ts`, `startRelay()`,
`deliverEnvelope()`.

### P2 — Double delivery on the origin node

**Problem.** If the origin node both *publishes* and also runs its own subscriber that
delivers locally, the authors' sockets could receive the frame twice (once from a
local fan-out, once from the pub/sub echo). Handlers must deliver **exactly once**.

**Fix.** `relayBroadcast()` is the single entry point and picks **one** delivery path:

- Relay **enabled** → publish only. Delivery happens purely through the subscriber
  path (`deliverEnvelope`), including on the origin node via its own subscriber.
- Relay **disabled** (dev, or Redis down) → fall back to `deliverLocally()`.

There is no path that both publishes and locally fans out from the same handler call.

### P3 — Echo to the sender: socket identity is not enough

**Problem.** When the author sends a message we must not echo it back to them, but a
raw socket reference cannot cross nodes. Only something serializable can ride the
envelope — and the natural key for "this user/device" is the **session id**.

**Fix — session-based exclusion (WorkSphere decision, "Option 1").** Exclusion is
applied to the *entire sending session*, not just the exact socket:

- `deliverLocally()` skips any subscriber whose `metadata.sessionId === senderSessionId`.
- `deliverEnvelope()` skips any subscriber whose `sessionId` equals the envelope's
  `excludeSessionId`.
- `relayBroadcast()` stamps `excludeSessionId` from `connectionManager.getMetadata(ws)?.sessionId`.

Resulting semantics (the feature we were asked to build):

```
User sends from laptop (session A):
  - mobile device   (session B, separate login)  -> receives the event   OK
  - laptop sender socket (session A)             -> receives only the ack
  - laptop second tab (same session A)           -> receives nothing      (no echo)
```

Trade-off accepted: a second tab under the same session does not get a realtime echo;
it sees the message on the next fetch/refresh. This is exactly "see it on mobile, but
not broadcast back to my laptop".

### P4 — Inconsistent exclusion broke the tests (identity vs session)

**Problem.** The first implementation excluded by **socket identity** locally
(`subscriber !== ws`) but by **session** on the relay receive path. The unit tests mock
`getMetadata` to return one shared session for every socket, so the session-based skip
also excluded the mocked "other subscriber" — the broadcast tests failed, and one
failing test threw *before* unsubscribing, leaking a subscriber into the singleton and
cascading failures into later tests.

**Fix.**

1. Unify on **session-based exclusion in both paths** (`deliverLocally` + `deliverEnvelope`).
2. Update tests to model the other subscriber as a **distinct session** (`session-2`,
   the "mobile device"), reflecting reality instead of the old shared-session shortcut.
3. Add a dedicated test that pins the semantics: a second socket on the sender's
   session receives nothing, while a different-session socket receives one frame.

### P5 — Duplicated broadcast code drifted across handlers

**Problem.** message create/update/delete, conversation create/update/delete, reaction,
reply, and typing each hand-rolled their own `subscribers?.forEach` blocks. Any new
handler could forget the relay path, silently remaining single-node.

**Fix.** A central facade — `relayBroadcast(type, ws, entityId, message)` — is now the
only broadcast entry point. All handlers were migrated to it:

- `messageHandler` — `ChannelMessageCreated` / `Updated` / `Deleted`
- `conversationHandler` — `ConversationMessageCreated` / `Updated` / `Deleted`
- `reactionHandler` — reaction events
- `replyHandler` — reply events
- `typingHandler` — typing.start / typing.stop

Changing policy (exclusion, channel, fallback) is now a one-file change.

### P6 — Untrusted cross-node payloads

**Problem.** Pub/Sub messages arrive from sibling nodes — or anything that can reach
the Redis instance — so payloads must not be trusted. A malformed JSON string or a
non-event type must never crash the subscriber loop or be fanned out to clients.

**Fix.** The receive path validates with `relayEnvelopeSchema` (Zod):

```ts
relayEnvelopeSchema = z.object({
  eventType: z.enum(WsEvent),      // must be a real event name
  entityId:  z.string().min(1),
  message:   z.unknown(),
  excludeSessionId: z.string().optional(),
});
```

`JSON.parse` is wrapped in try/catch; malformed or invalid envelopes are dropped and
logged (`RELAY_INVALID_ENVELOPE`), never dispatched. The subscriber's `"message"`
handler is registered once and channel-guarded (`channel !== RELAY_CHANNEL` → ignore).

### P7 — Redis down must not take the app down

**Problem.** Redis is optional in dev/single-node, and its availability should never
crash the HTTP/WebSocket server or hang requests.

**Fix.**

- Feature flag `RELAY...` (`z.enum(["true", "false"])`), read once at module load.
- ioredis clients are **lazy**: `lazyConnect: true`, `maxRetriesPerRequest: 1`,
  `enableOfflineQueue: false` — a dead Redis neither hangs nor silently queues.
- `connectRedis()` try/catch returns `false` on failure; the server boots in degraded
  single-node mode.
- `relayBroadcast()` wraps `publish` in try/catch → on error it degrades to
  `deliverLocally()` (never throws into the handler).
- `getPublisher()` / `getSubscriber()` **throw** when the relay is disabled or not
  connected — wiring bugs surface loudly instead of silently no-oping.

### P8 — Boot/shutdown ordering and idempotency

**Problem.** The relay must not start before Redis clients are ready, must not
double-subscribe, and must shut down cleanly.

**Fix.** In `backend/src/server.ts`:

```ts
server.listen(PORT, async () => {
  heartbeatManager.start();
  if (await connectRedis()) startRelay();
});
```

Shutdown order is `stopRelay()` **before** `stopRedis()` — we unsubscribe and detach
the message listener from a live client first, then disconnect the clients.

Idempotency lives in `startRelay()`: a `started` flag, a single `"message"` listener
bound **outside** the `subscribe` callback (so it is never re-registered), and
`stopRelay()` resets the flag.

---

## 4. Final architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              Redis Pub/Sub                  │
                    │        channel: "forge:relay"               │
                    └────────────▲──────────────────▲─────────────┘
                                 │ publish          │ subscribe (fan-out)
                        ┌────────┴─────────┐  ┌─────┴──────────────┐
                        │   Backend Node A │  │    Backend Node B  │
                        │  ┌─────────────┐ │  │  ┌──────────────┐  │
                    ws  │  │ eventRouter  │ │  │  │ eventRouter  │  │  ws
  laptop ──────────────►│  │  handlers    │ │  │  │  handlers    │  │◄──────────── mobile
  (session A)           │  └──────┬──────┘ │  │  └──────┬───────┘ │            (session B)
                        │  relayBroadcast()│  │        │           │
                        │  route: enabled? │  │        │           │
                        │    yes → publish │  │        │           │
                        │    no  → local   │  │        │           │
                        │  deliverLocally()│  │        │           │
                        │  deliverEnvelope()◄─┼────────┘           │
                        │  (skip session A)│  │  (skip session A)  │
                        └─────────────────┘  └─────────────────────┘
```

Everything behind `relayBroadcast()` has exactly one delivery path, and session-based
exclusion is identical whether the frame was delivered locally or via the bus.

## 5. Implementation map

| File | Role |
|---|---|
| `backend/src/config/redis.ts` | Lazy ioredis clients, `relayEnabled === "true"`, `connectRedis()`/`stopRedis()`, throwing accessors |
| `backend/src/config/env.ts` | `REDIS_URL`, `REALTIME_RELAY_ENABLED: z.enum(["true", "false"])` |
| `backend/src/websockets/relay.ts` | `RELAY_CHANNEL`, `relayBroadcast()` (publish + local fallback), `deliverLocally()`, `deliverEnvelope()` (session skip), `startRelay()`/`stopRelay()` |
| `backend/src/websockets/schema/envelope.ts` | `relayEnvelopeSchema` + `RelayEnvelope` type |
| `backend/src/websockets/handlers/*` | message, conversation, reaction, reply, typing — all broadcast via `relayBroadcast()` |
| `backend/src/server.ts` | Gated boot (`connectRedis() → startRelay()`), shutdown order (`stopRelay() → stopRedis()`) |
| `backend/.env` / `backend/.env.test` | Relay on for dev/prod; pinned `false` in tests |

## 6. Testing strategy

- Unit tests run with `REALTIME_RELAY_ENABLED=false` (pinned in `.env.test`), so they
  exercise the pure local-fallback path (`deliverLocally()`).
- Subscribers are mocked as **distinct sessions**, and a dedicated test asserts the
  same-session exclusion (section P4).
- Known gap: the cross-node path (`publish` → Redis → `deliverEnvelope`) is **not**
  covered by unit tests. A small integration test against a real (or mocked) Redis,
  spawning two subscribers, is the documented follow-up.

## 7. Decision record

- **Transport:** Redis Pub/Sub on one channel `forge:relay` (signal bus, not a store).
- **Exclusion:** session-based (WorkSphere Option 1) — exclude the whole sending
  session, not just the socket; other sessions (your phone) always receive.
- **Degradation:** relay off / Redis down → `deliverLocally()`, exactly the old
  single-node behavior, with session semantics preserved.
- **Safety:** envelopes are schema-validated and never crash or leak into clients;
  accessors throw to expose wiring bugs.