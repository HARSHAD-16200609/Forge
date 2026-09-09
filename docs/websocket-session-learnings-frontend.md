# WebSocket Session Learnings — Frontend

Personal session journal: realtime WebSocket development for the Slack clone **frontend**.
Mirror of `docs/websocket-session-learnings.md` (backend). Update as new sessions add decisions, features, and debugging lessons.

---

## 1. Working Agreement (the build loop)

- **User implements** the feature code; **agent reviews/points out bugs**, writes gate tests, and fixes only when explicitly told.
- Loop: implement → review → fix → gate tests → `npm run typecheck` + `npm test` green.
- When the user says a specific word like **"go"**, the agent may implement; otherwise the agent stays in review/plan mode.

## 2. Hard Directives (do not violate)

1. **Never rename event values** — they must mirror the backend exactly (`channel.message.*`, `conversation.message.*`, `typing.start/.stop`, `presence.update`, `ping/.pong`, `error`). `frontend/src/features/Messages/types.ts:89`.
2. **Outbound frames ride in `payload`; inbound content in `data`** of `WsResponse`. Never double-stringify.
3. **Upload cap = 3** attachments (`POST /uploads`, `message.service.ts:54-66`) — matches backend `upload.route.ts` `.array("attachments", 3)`.
4. **Echo-type ack matching, no `requestId`.** The backend echoes result events to the sender; correlate by `type` + entity/message ids. Do not invent correlation payloads the backend ignores.
5. **Cache writes must unwrap `InfiniteData`.** `useInfiniteQuery` caches `{ pages, pageParams }`, not a bare `paginatedMessages[]` — every `setQueryData` writer goes through `updateInfinitePages` (`RealtimeProvider.tsx:46-55`).

## 3. Protocol Contracts (client ⇄ server)

### Outbound envelope (`WsEnvelope`)
```json
{ "type": "<WsEvent>", "payload": { ... } }
```
Built by `realtimeActions` and sent via `realtimeSocket.send` / `sendQueued`.

### Inbound frame (`WsResponse`)
```ts
type WsResponse = {
    type: WsEvent;
    success: boolean;
    statusCode: number;
    message?: string;
    error?: { code: string; errorMessage: string };
    data?: unknown;   // payloads always ride here
};
```

### Current events (`features/Messages/types.ts:89`)
- Mirrors backend `types/events.ts`:
  `conversation.subscribe/.unsubscribe`, `conversation.message.create/.created/.update/.updated/.delete/.deleted/.reaction/.reply`, the same set for `channel.*`, `typing.start/.stop`, `presence.update`, `ping/.pong`, `error`.

### Ack convention (backend → sender)
- Success acks echo the **result** event with `data` (`.created`/`.updated`/`.deleted` = full `Message`; `.reply` = reply `Message`; `.reaction` = `ReactionDelta`). Sender is excluded from the broadcast, so exactly one frame reaches the publisher.
- Error acks echo the **request** event with `success: false` + `error.code`. See `websocket-error-handling-implementation-frontend.md`.

## 4. Architecture Tenets (every realtime piece)

1. **`socket.ts` is the only module that touches `window.WebSocket`.** Everything else imports `realtimeSocket` and calls typed helpers.
2. **`RealtimeProvider` is the single frame router** — it must stay the only consumer of `onFrame`; new event types are added by extending `handleFrame`, not by new listeners.
3. **Cache writers are pure.** `realtimeCache.ts` imports nothing renderable and mutates nothing; testable with plain objects.
4. **Selection drives subscriptions** — subscribe/unsubscribe happen in a provider effect keyed on workspace/channel/conversation ids; every reconnect re-runs `handleConnected` (presence + resubscribe + invalidate).
5. **Composer clears only after the ack** (target): `handleSend` already `await`s `onSend` and keeps editor content on throw (`MessageComposer.tsx:448-463`). Do not clear the draft optimistically.
6. **Typing is throttled** (start ≥1.5s apart, stop after 3s idle) and fire-and-forget (`send`, never `sendQueued`) — dropping a typing frame is harmless.
7. **Parallel entities exist.** Channel and conversation pages live under different query keys (`["messages", id]` vs `["conversation-messages", id]`); `Message.entity` carries `{ type, id }` to pick the right cache.
EOF
## 5. Feature Reference

### Message send / edit / delete / react / reply
- One mutation hook per op (`hooks/useSendMessage.ts`, `useSendConversationMessage.ts`, `useEditMessage.ts`, `useDeleteMessage.ts`, `useReact.ts`, `useSendReply.ts`), each: upload files → `realtimeActions.*` (`sendQueued`). Channel vs conversation is an `entityType: "channel" | "conversation"` parameter; hooks resolve the right `WsEvent` internally.
- Inbound frames for these ops land in `handleFrame` → `upsertMessage` (append-or-replace by id in every page) / `applyReactionDelta` (per-user add/remove) / `updateConversationLastMessage` (conversation list preview only).
- `MessageBubble` decides ownership by `currentUser?.id === message.sender.id` (Edit/Delete buttons, reaction highlight) — this **requires `/auth/user` to return `id`** (backend `auth.repository.getUser` select).
- CHANNEL P1: hook mutationFns are fire-and-forget — acks not awaited (see error-handling doc).

### Draft persistence
- `composerStore` (zustand + `persist`) stores raw editor.js JSON per `channelId`; `MessageComposer` seeds the editor with `getDraft(channelId) || initialContent` (`MessageComposer.tsx:265-276`) and clears on send success. Edit modals reuse the composer with `initialContent` and a distinct `channelId = message.id` to isolate drafts.

### Typing indicators
- Outbound: `typingStart/Stop` (throttled, fire-and-forget). Inbound: `typingStore.setTyping/stopTyping` (5s expiry) → `TypingIndicator` renders "X is typing…" / "N people are typing…" above the composer; usernames resolved from the presence roster when available.

### Presence
- Outbound: `presence(workspaceId)` on connect/resubscribe. Inbound: `presenceStore.seedRoster` (bootstrap `online[]`) and `applyPresence` (per-user online/offline). Used for `ConvoMembers` presence dots (green ring + "online" label). Roster is **not** evicted on logout/workspace switch today (gap).

### Heartbeat
- Client-only 25s `ping` while open; socket replies to a defensive server `pong` if the backend ever sends one. No server-initiated pings (`socket.ts:120-128`).

### Uploads & REST boundary
- **REST owns:** auth, workspace/channel/conversation management, uploads (`POST /uploads`, cap 3, returns `[{id}]`), file deletes, history reads (`useMessages`, `useConversationMessages`, `useDms`, `useDm`).
- **WS owns:** all message writes (create/edit/delete/reply/react), typing, presence, subscriptions.

## 6. Lessons / Debug Stories

1. **Reactions (and messages) stopped updating "live".** Root cause: `useInfiniteQuery` caches `InfiniteData` (`{ pages, pageParams }`), but the writers operated on a bare array — `setQueryData` replaced the whole cache with a malformed shape. Fix: `updateInfinitePages` unwraps/rebuilds `InfiniteData` before calling `upsertMessage`/`applyReactionDelta` (`RealtimeProvider.tsx:46-55`).
2. **"Errors" that are stale editor diagnostics.** Props (`onEdit`, `typingTarget`, `initialContent`, `workspaceId`) existed on disk and `npm run typecheck` was green, yet the editor kept flagging them (stale TS server, `modelVersionId 1/3`). Fix: restart the TS server, don't edit code for phantom errors.
3. **`currentUser.id` undefined → no Edit/Delete.** Backend `GET /auth/user` returned `{ name, username, avatar, email }` — the `getUser` select omitted `id` (and `timezone`). Fixed in `backend/.../auth.repository.ts`. Frontend only reads `user.id`, `user.name`, `user.email`, `user.avatar`.
4. **Avatar "undefined" in the sidebar.** `ui/avatar.tsx` `Profile` always rendered `AvatarImage` with a hardcoded remote CDN fallback; with `avatar = null` it showed a broken image. Fix: render `AvatarImage` only when a real `avatarUrl` exists, keep the `AvatarFallback` (initials) **in the tree** so Radix can swap to it when the image is missing/fails.
5. **Pre-existing failures are not yours.** 6 auth unit tests (`tests/auth/useLoginForm.test.ts`, `useRegisterForm.test.ts`) fail with "useAuth must be used inside AuthProvider" — from the auth refactor (commit `6209d85`), unrelated to realtime work. Pre-existing eslint errors + 2 react-compiler errors in `MessageComposer.tsx` predate the WS work (verified via `git show HEAD`).
6. **Typecheck strictness:** type-only imports (`import type { Message }`), `async` `mutationFn`s, and removal of an unused `CheckIcon` import in `ui/avatar.tsx` were required to keep `tsc -b` green.

## 7. Test Conventions (`tests/realtime/*.test.ts`, vitest)

- Pure-function tests only (realtimeCache, stores): build `Message` fixtures with a `makeMessage(overrides)` helper; assert on returned arrays/state.
- Store tests (`typingStore`, `presenceStore`) may arm `setTimeout` — clear timers / use the store API to converge before the test ends (module-scope expiry timers).
- Alias `@` → `src` is configured in `vite.config.ts` (`test.alias`, `resolve.alias`); jsdom environment, `globals: true`, setup `src/test/setup.ts`.
- Run: `npm run typecheck` → `npm run test` → `npm run build` (in `frontend/`).

## 8. Repo State & Loose Ends

- **Verification:** `npm run typecheck` clean; `npm run build` succeeds; realtime unit tests (`tests/realtime/realtimeCache.test.ts`, `typingStore.test.ts`, `presenceStore.test.ts`) pass. `npm run test` shows 22 pass / 6 pre-existing auth failures (2 files).
- **Docs:** `websocket-architecture-frontend.md`, `websocket-error-handling-implementation-frontend.md`, this journal — mirror the backend docs in `docs/`.
- **Roadmap (hardening, not yet built):** ack tracking + error surfacing (see error-handling doc), connection-status banner, orphaned-reply rendering, presence roster eviction on logout/workspace switch, channel-list preview refresh, Conversations parity (near-bottom scroll guard, edit-modal draft cleanup).
- **Backend note:** `GET /auth/user` now returns `id`/`timezone`; restart the backend for `user.id` to appear. Backend still has no `requestId` echo — any ack design must use echo-type matching.
