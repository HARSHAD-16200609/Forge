# WebSocket Architecture

This document explains the folder structure of the realtime WebSocket feature in `backend/src/websockets/`, the responsibility of each file, and how the pieces communicate.

## Folder Structure

```
backend/src/websockets/
├── websocketServer.ts              # Entry point — creates the WebSocketServer, owns the connection lifecycle
├── connectionManager.ts            # Registry of live sockets: userId -> Set<WebSocket>, plus per-socket metadata
├── eventRouter.ts                  # Dispatcher — routes an inbound event to its registered handler
├── subscriptionManager.ts          # Bidirectional maps: socket <-> conversation subscriptions
├── handlers/
│   ├── conversationHandler.ts      # Handles conversation.subscribe / conversation.unsubscribe
│   └── messageHandler.ts           # Stub for message.create — NOT registered (dead code)
├── schema/
│   └── envelope.ts                 # Zod wire schemas + parseEnvelope() used at the socket boundary
└── types/
    ├── auth.ts                     # ConnectionMetadata, AuthenticatedUser, AuthenticatedUpgradeRequest
    ├── events.ts                   # WsEvent constant map + union type (the event contract)
    └── websocketMessage.ts         # WebSocketMessage<T>, WsResponse<T> envelope types
```

## Per-File Significance

| File | Role | Exports |
|------|------|---------|
| `websocketServer.ts` | Creates `WebSocketServer({ noServer: true })`. Listens for `connection`, registers the socket with the connection manager, parses inbound frames, and hands them to the event router. | `websocketServer` (singleton) |
| `connectionManager.ts` | Tracks which sockets belong to which user and stores per-socket `ConnectionMetadata` (`userId`, `sessionId`, `connectedAt`). Supports multi-device (`Set<WebSocket>` per user). | `connectionManager` (singleton) |
| `subscriptionManager.ts` | Maintains `socket -> Set<conversationId>` and `conversationId -> Set<socket>`. Lets the broadcaster (future) find which sockets to push to. | `subscriptionManager` (singleton) |
| `eventRouter.ts` | A `Map<WsEvent, EventHandler>` that resolves the handler from `message.type` and awaits it. Errors are logged and an `error` envelope is sent back to the socket. | `eventRouter` (singleton) |
| `handlers/conversationHandler.ts` | Validates the payload with Zod and applies the subscription. Reads identity via `connectionManager.getMetadata(ws)`. | `conversationHandler` |
| `handlers/messageHandler.ts` | Draft message handler. Unused — commented out in `eventRouter`; misnamed class (`ConversationHandler`). | `conversationHandler` |
| `schema/envelope.ts` | Wire contract: `envelopeSchema` (type + payload), `parseEnvelope()` (JSON parse + validate), plus `conversationIdSchema` and `messageEnvelopeSchema`. | `parseEnvelope`, schemas, inferred types |
| `types/auth.ts` | Identity metadata attached to the request during the HTTP upgrade. | interfaces |
| `types/events.ts` | The single source of truth for valid event names (`conversation.subscribe`, `message.create`, `typing.start`, etc.). | `WsEvent` const + type |
| `types/websocketMessage.ts` | Generic envelope shapes shared by server push and client send. | `WebSocketMessage`, `WsResponse` |

All managers/router/handlers are **module-level singletons** (`export const x = new X()`), so the folder behaves like a small in-process service: shared state lives inside each singleton, and files communicate by importing those singletons.

## How the Pieces Communicate

### 1. Upgrade / Connection lifecycle (outside → inside)

`server.ts` owns the HTTP upgrade and gives the WebSocket layer an authenticated socket:

```
HTTP upgrade request
        │
        ▼
server.ts "upgrade" handler
  ├─ parse accessToken cookie
  ├─ verifyAccessToken → validateSession
  └─ attach user  →  req.user = { userId, username, sessionId }
        │
        ▼
websocketServer.handleUpgrade(req, socket, head)
        │
        ▼
websocketServer.emit("connection", ws, req)          [websocketServer.ts]
        │
        ▼
connectionManager.registerConnection(ws, metadata)    [connectionManager.ts]
```

### 2. Inbound message lifecycle (client → handler)

```
ws.on("message", data)                                 [websocketServer.ts]
        │
        ▼
parseEnvelope(data.toString())                        [schema/envelope.ts]
  ├─ fail  → ws.send(error envelope)
  └─ ok    ───────────────────────────► eventRouter.dispatch(ws, message)
                                              │
                                              ▼
                                    handlers.get(message.type)   [eventRouter.ts]
                                              │
                    ┌───────────────────────────────────────────┐
                    ▼                                           ▼
        handlers/conversationHandler.ts               handlers/messageHandler.ts
        (validates conversationIdSchema)              (stub, not registered)
                    │
                    ▼
        subscriptionManager.subscribe/unsubscribe     [subscriptionManager.ts]
                    │
                    ▼
        connectionManager.getMetadata(ws)             [connectionManager.ts] (identity)
```

Key point: **`websocketServer.ts` is the only file that talks to the raw socket**. Everything below it is orchestrated by passing `(ws, message)` down and is reached through `eventRouter`'s handler registry.

### 3. Dependency graph (who imports who)

```
server.ts ─────────────► websocketServer.ts ─────────────► connectionManager.ts
            emits                                   │
            connection(ws, req)                     ├──► schema/envelope.ts
                                                   ▼
                                          eventRouter.ts ──► handlers/conversationHandler.ts
                                                              ├─► subscriptionManager.ts
                                                              └─► connectionManager.ts
```

All cross-file references flow **downward** through imports of singletons. There is a single shared vocabulary (`types/`) and a single validation point (`schema/`), which is why `handlers`, `eventRouter`, and `subscriptionManager` can stay loosely coupled.

## Notable Gaps (found while documenting — not changed)

1. **Close handling is broken / leak.** `websocketServer.on("close", ...)` is registered *inside* the `connection` callback (websocketServer.ts:42). `ws` is a `WebSocket`, not the server — so this fires only when the whole server closes. A client disconnect never triggers `connectionManager.removeConnection` or `subscriptionManager.removeSocket`, leaving stale sockets/subscriptions in memory. The correct hook is `ws.on("close", ...)`, and it should call `removeConnection` + `removeSocket`.

2. **`messageHandler.ts` is dead code.** It's not registered in `eventRouter` (commented out), and its exported class is misnamed `ConversationHandler` (duplicate of the real one).

3. **Unimplemented event types.** `typing.start/stop`, `presence.update`, and `message.update/delete` are declared in `types/events.ts` but have no handlers.

4. **Response envelope mismatch.** Errors are sent as bare `{ type: "error", payload: { message } }`, whereas `WsResponse<T>` in `types/websocketMessage.ts` defines `{ type, success, payload, error }` — the utility type isn't actually used.

5. **Message broadcasting is absent.** `subscriptionManager.getSubscribers` is ready for a broadcaster, but nothing currently reads it; server-push of new messages doesn't exist yet.