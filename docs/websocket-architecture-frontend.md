# WebSocket Architecture — Frontend

This document explains the realtime WebSocket feature in `frontend/src/realtime/`, the responsibility of each file, and how the pieces communicate with the backend realtime layer documented in `websocket-architecture.md`.

## Folder Structure

```
frontend/src/realtime/
├── socket.ts                  # RealtimeSocket singleton — owns the WebSocket, status, reconnection, heartbeat, buffering
├── RealtimeProvider.tsx       # App-wide React provider — connects/subscribes, routes inbound frames into caches + stores
├── realtimeActions.ts         # Typed outbound send helpers, one per event
├── realtimeCache.ts           # Pure cache writers for react-query message pages + conversation previews
├── presenceStore.ts           # zustand roster: workspace → userId → { username, status }
└── typingStore.ts             # zustand per-entity typing maps with expiry timers

consumers / support:
frontend/src/features/Messages/
├── types.ts                   # WsEvent names, WsEnvelope/WsResponse, Message + payload/delta types (the wire vocabulary)
├── message.service.ts         # The only REST messaging path: history reads, DM/conversation reads, file uploads
├── hooks/                     # react-query reads + mutation hooks that bridge UI and the socket
└── components/                # MessageComposer, MessageBubble, TypingIndicator, ConvoMembers, …
frontend/src/app/providers/AppProvider.tsx   # mounts <RealtimeProvider> inside Auth + Query providers
frontend/src/app/pages/ChannelHome.tsx       # channel consumer: useMessages + send/edit/delete/react/reply hooks
frontend/src/app/pages/Conversations.tsx     # conversation (DM/GDM) consumer — same realtime hooks, "conversation" entity
frontend/src/stores/composerStore.ts         # persisted draft JSON per channel/entity id
frontend/src/stores/uiStore.ts               # selected channel / selected conversation (drives subscriptions)
```

## Per-File Significance

| File | Role | Exports |
|------|------|---------|
| `socket.ts` | Owns the browser `WebSocket`. `connect()`/`disconnect()`, status machine (`idle → connecting → open → reconnecting → closed`), exponential backoff 1s→30s + jitter, 25s client ping, outbound queue (`sendQueued` buffers while not open, `flushQueue` on open). `handleMessage` JSON-parses frames and fans them out to `frameListeners`; keeps a defensive `ping`→`pong` reply. The only module that touches `window.WebSocket`. | `RealtimeSocket`, `realtimeSocket` (singleton), `ConnectionStatus` |
| `RealtimeProvider.tsx` | Mounted once in `AppProvider` (`app/providers/AppProvider.tsx:17`). Connects when `useAuth().user` is set, disconnects on logout. Registers `handleFrame` that routes every inbound `WsResponse` into the react-query cache (channel pages keyed `["messages", id]`, conversation pages keyed `["conversation-messages", id]`, DMs preview keyed `[workspaceId]`) or the zustand stores. Owns subscribe/unsubscribe as the selection changes and resubscribes on each reconnect. | `RealtimeProvider` |
| `realtimeActions.ts` | Typed fire-and-forget outbound calls: subscribe/unsubscribe channel + conversation, sendChannelMessage, sendConversationMessage, sendReply, update/delete (channel + conversation), react, typingStart/Stop, presence, ping. Composes payloads per the backend schemas. | `realtimeActions` |
| `realtimeCache.ts` | Pure functions that rewrite cached shapes (no side effects): `upsertMessage` (append-or-replace a `Message` in every page), `applyReactionDelta` (add/remove a per-user reaction), `updateConversationLastMessage` (refresh DM/GDM preview with plain text), `extractPlainText` (unwrap editor.js blocks). | `upsertMessage`, `applyReactionDelta`, `updateConversationLastMessage`, `extractPlainText` |
| `presenceStore.ts` | zustand: `workspaceId → userId → { username, status }`. `seedRoster` (roster bootstrap, `online[]`), `applyPresence` (per-user online/offline broadcast), `clearWorkspace` (evict), `isOnline` selector. | `usePresenceStore` |
| `typingStore.ts` | zustand: `entityId → userId → username`. `setTyping` arms a 5s expiry timer per `entity:user`; `stopTyping` clears it; `getUserNames` feeds the indicator. Timers live in a module-scope `Map`. | `useTypingStore` |
| `types.ts` | Single shared vocabulary: `WsEvent` constant map (frontend mirror of backend `types/events.ts`), `WsEnvelope` (outbound `{ type, payload }`), `WsResponse` (inbound `{ type, success, statusCode, message, error?, data? }`), `Message`, payload/delta interfaces. | `WsEvent`, `WsEnvelope`, `WsResponse`, `WsMessageEntityType`, `Message`, `ReactionDelta`, presence/typing payloads |

All managers/singletons are **module-level singletons** (`export const x = new X()`, `create<X>()(...)`), so the folder behaves like a small in-process client service: shared state lives inside the socket and the two zustand stores, and files communicate by importing those singletons.
## How the Pieces Communicate

### 1. Connection lifecycle (auth-driven → socket)

```
useAuth().user changes                                    [RealtimeProvider.tsx:164-170]
    ├─ null  → realtimeSocket.disconnect()  (stop ping, clear queue, status "idle")
    └─ user  → realtimeSocket.connect()
                  │
                  ▼
RealtimeSocket.open() → new WebSocket(env.wsUrl)          [socket.ts:75-84]
    ws.onopen   → startPing() (25s), status "open", flushQueue()   [socket.ts:88-93]
    ws.onmessage→ handleMessage() → JSON.parse → frameListeners     [socket.ts:95-97, 108-131]
    ws.onclose  → handleClose() → scheduleReconnect() unless manual [socket.ts:142-170]
```

`env.wsUrl` is derived from `VITE_API_BASE_URL` (http→ws, https→wss) or overridden by `VITE_WS_URL` (`lib/env.ts`).

### 2. Outbound path (composer → hook → actions → socket)

```
MessageComposer.handleSend
  → await onSend(contentJson, files, replyToId)     [MessageComposer.tsx:448-464]
      └─ useSendMessage.mutationFn                  [hooks/useSendMessage.ts]
            ├─ messageService.uploadFiles(files)    REST POST /uploads (cap 3), returns uploadIds
            └─ realtimeActions.sendChannelMessage(wsId, channelId, content, uploadIds)
                  └─ realtimeSocket.sendQueued(channel.message.create, payload)  [socket.ts:70-73]
                        ├─ status "open" → ws.send immediately
                        └─ otherwise     → push to queue (flushed on next open)
  composer clears editor + draft only after onSend resolves  (fire-and-forget today)
```

Typing: `MessageComposer.handleTypingActivity` throttles `typingStart` (once per 1.5s) and auto-sends `typingStop` after 3s idle (`MessageComposer.tsx:179-197`). Presence: sent once on connect/resubscribe via `realtimeActions.presence(workspaceId)`.

### 3. Inbound path (socket → provider → cache/stores)

```
socket.onmessage → frameListeners → RealtimeProvider.handleFrame   [RealtimeProvider.tsx:95-157]
  1. message frames (created/updated/deleted/reply) → applyMessageFrame
       entity.type === "channel"  → setQueryData(["messages", entity.id], updateInfinitePages(upsertMessage))
       entity.type === "conversation" → setQueryData(["conversation-messages", entity.id], …)
           + if conversation.message.created & top-level& !deleted → refresh [workspaceId] preview
  2. reaction frames → setQueriesData(["messages"|"conversation-messages"], applyReactionDelta)
  3. presence.update → seedRoster | applyPresence
  4. typing.start/stop → typing store
```

`updateInfinitePages` unwraps react-query's `InfiniteData` (`data.pages`) — the cache stores `{ pages, pageParams }`, not a bare array. All `setQueryData`/`setQueriesData` writers go through it; this is what fixes live reaction/message updates.

### 4. Selection + resubscribe

```
Workspace / channel / conversation changes             [RealtimeProvider.tsx:204-227]
    → unsubscribe previous (if any), subscribe new
    → presence(workspaceId)

Reconnect (status "reconnecting" → "open")             [RealtimeProvider.tsx:172-202]
    → realtimeActions.presence(wsId)
    → subscribe selected channel + selected conversation
    → invalidateQueries(["messages", id]) / (["conversation-messages", id]) / ([wsId])
```

## Dependency Graph

```
AppProvider ──► RealtimeProvider ──► socket.ts ─────► features/Messages/types.ts (wire types)
      │            │      │
      │            ├──────┴──► realtimeActions.ts
      │            ▼
      │     realtimeCache.ts (via updateInfinitePages) → react-query
      │     presenceStore.ts / typingStore.ts (zustand)
      ▼
pages (ChannelHome / Conversations)
  ├── useMessages / useConversationMessages   REST reads → react-query cache (mutated by provider)
  └── mutation hooks → realtimeActions → socket
```

All cross-file references flow **downward** through imports of singletons. There is a single shared vocabulary (`features/Messages/types.ts`) and two pure-writer modules (`realtimeCache`, stores), which keeps `socket`, the provider, and the pages loosely coupled.

## Notable Gaps (found while documenting — not changed)

1. **Sends are fire-and-forget.** `send()`/`sendQueued()` return `boolean`/`void`; mutation hooks resolve immediately. The backend acks every message op to the sender (`.created`/`.updated`/`.deleted`/`.reply` echo frames), but the client never correlates a send to its ack — a `success: false` frame or a dropped socket is invisible, and the composer clears the draft before delivery is confirmed.
2. **Error frames are ignored.** `RealtimeProvider.handleFrame` only branches on successful data frames; there is no `frame.success === false` handling anywhere (typing/presence/connect-send losses are silent too).
3. **No connection-status UI.** `realtimeSocket.onStatus` is consumed only to trigger resubscribe; users get no "reconnecting…" indicator.
4. **Reply frames upsert into the conversation-messages cache even when the parent isn't loaded**, and pages flatten replies under parents (`ChannelHome.tsx:81-101`) — an orphaned reply (parent outside the loaded window) never renders.
5. **Presence roster is never evicted.** `presenceStore.clearWorkspace` exists but is unused on logout/workspace switch; stale "online" entries persist.
6. **`updateConversationLastMessage` runs only for conversations.** `channel.message.created` frames do not refresh any channel-list preview.
7. **Ack correlation has no `requestId`.** Backend frames carry only `type` + ids, so per-message correlation must rely on echo-type matching (see `websocket-error-handling-implementation-frontend.md`).
