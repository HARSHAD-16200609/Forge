# WebSocket Error Handling — Frontend Implementation

Design for standardized ack/error handling on the client, matching the backend contract codified in `websocket-error-handling-implementation.md`. This documents the **target design** against the current fire-and-forget client — the implementation itself is tracked separately.

## The wire contract (what the backend already guarantees)

Every frame from the backend is a single JSON object with the same shape (`frontend/src/features/Messages/types.ts:130`):

```json
{
  "type": "channel.message.create",
  "success": false,
  "message": "Invalid message payload",
  "statusCode": 400,
  "error": { "code": "VALIDATION_ERROR", "errorMessage": "Invalid message payload" }
}
```

- **Success acks echo the *result* event**: a `channel.message.create` request is answered with one `channel.message.created` frame (`success: true`, `data: <Message>`) sent to **the sender**, and the same frame broadcast to other subscribers. The sender never receives a duplicate.
- **Error acks echo the *request* event** with `success: false` — e.g. `channel.message.create`, `channel.message.update`, `conversation.message.reaction`.
- `type: "error"` is only used when the original event type cannot be known (envelope parse failure).
- `success: false` is guaranteed whenever `error` is present.

### Error codes (`backend/src/websockets/handlers/*` + eventRouter)

| Code               | Used for                                                          |
|--------------------|-------------------------------------------------------------------|
| `VALIDATION_ERROR` | Zod rejection of an envelope / handler payload (HTTP 400)         |
| `UNAUTHORIZED`     | Socket has no `ConnectionMetadata` (HTTP 401)                     |
| `FORBIDDEN`        | Not a workspace/entity member, not the sender, message/entity mismatch (HTTP 403) |
| `NOT_FOUND_ERROR`  | Message / parent does not exist (HTTP 404)                        |
| `BAD_REQUEST`      | Already-deleted message, invalid reply parent, etc. (HTTP 400)    |
| `INTERNAL_ERROR`   | Any unhandled exception inside a handler (HTTP 500, sanitized)    |

### Ack frame per op (echo-type matching source)

| Request (`realtimeActions`) | Success ack (`success: true`, `data`) | Backend source |
|------------------------------|----------------------------------------|----------------|
| `channel.message.create` | `channel.message.created` — full `Message`, sender + others | `messageHandler.ts:175` |
| `conversation.message.create` | `conversation.message.created` — full `Message` | `conversationHandler.ts:…` (same pattern) |
| `channel.message.update` / `conversation.*` | `.updated` — edited `Message` | `messageHandler.ts:252` |
| `channel.message.delete` / `conversation.*` | `.deleted` — tombstone `Message` (`deletedAt` set) | `messageHandler.ts:326` |
| `channel.message.reply` / `conversation.*` | `.reply` — created reply `Message` | `replyHandler.ts:94` |
| `channel.message.reaction` / `conversation.*` | `.reaction` — `ReactionDelta { userId, username, messageId, reaction, action }` | `reactionHandler.ts:102` |
| `typing.start` / `typing.stop` | echo of the request type (broadcast), `data: { userId, entityId }` | `typingHandler.ts:69` |
| `presence.update` | `data: { workspaceId, online[] }` roster reply to the publisher | `presenceHandler.ts` |
| `ping` | `pong` (unconditional) | `heartbeatHandler.ts` |

Because the sender is **excluded from the broadcast**, each ack above is delivered to the publisher exactly once.
## Proposed API

### `src/realtime/ackTracker.ts` (new)

Module-level in-flight registry so the socket layer can resolve sends:

```ts
type AckHandler = {
    type: string;                       // request event type (for error matching)
    key: string;                        // correlation key (below)
    resolve: (frame: WsResponse) => void;
    reject: (error: WsError) => void;
    timeout: ReturnType<typeof setTimeout>;  // 10s default
};

const ackTracker = {
    register(spec): void;
    resolve(frame: WsResponse): boolean;      // true if a waiter matched
    rejectAll(code?: string): void;            // on disconnect
    dispose(key: string): void;
};
export { ackTracker };
```

### Correlation keys (echo-type matching — no backend `requestId`)

| Op | Key | Matched on |
|----|-----|------------|
| create (channel/conversation) | `created:<entityId>` | Next `*.message.created` frame whose `data.entity.id` matches (FIFO per connection; only one create can be in-flight per entity) |
| update / delete | `updated\|deleted:<messageId>` | Frame `*.message.updated\|deleted` with `data.id === messageId` |
| reply | `reply:<entityId>` | `.reply` frame with matching `data.entity.id` |
| react | `reaction:<messageId>` | `.reaction` frame with `data.messageId` (also carries `userId` — ignore other users' deltas for the ack; they only affect the cache) |
| any op | error | Any frame with `success: false` and `type` equal to the request type — reject |

**Rules:** register **before** calling `send` to avoid the echo-before-register race; on `success: false` reject (unique `code`); on 10s timeout reject with `TIMEOUT`; on `disconnect()` reject all pending (socket loss) so no promise hangs forever.

### `src/realtime/socket.ts` (additions)

```ts
sendWithAck(type, payload): Promise<WsResponse>;
sendQueuedWithAck(type, payload): Promise<WsResponse>;  // queue while closed, register waiter
```

`sendWithAck` registers a key in `ackTracker`, sends, and returns a promise; the inbound `handleMessage` path calls `ackTracker.resolve(frame)` **before** fanning out to `frameListeners` (so the ack also reaches the cache writers normally). Existing `send`/`sendQueued` stay for fire-and-forget (ping, presence, typing, subscribe, unsubscribe).

## Files changed (target)

| File | Change |
|------|--------|
| `src/realtime/ackTracker.ts` | New — in-flight registry, correlation keys, timeout, reject-all on disconnect |
| `src/realtime/socket.ts` | Add `sendWithAck`/`sendQueuedWithAck`; resolve/route error frames through the tracker |
| `src/realtime/RealtimeProvider.tsx` | Handle `frame.success === false`: surface unmatched errors + reject tracked sends |
| `src/features/Messages/hooks/useSendMessage.ts` (+ conversation/reply/edit/delete/react) | `mutationFn` awaits the ack, **throws** on `success: false` / timeout |
| `src/features/Messages/components/MessageComposer.tsx` | No change needed — already keeps editor content on `onSend` throw (`MessageComposer.tsx:461-463`) |
| (optional) connection-status banner | Subscribe `realtimeSocket.onStatus`; show "Reconnecting…" on `reconnecting`/`closed` |

## Bugs this design fixes

1. **Silent message loss.** Composer clears the draft after a queued send that may never be delivered or may be rejected server-side.
2. **Un-correlated errors.** `success: false` frames are currently dropped by `handleFrame` (it only branches on success data).
3. **Dead promises.** Mutations resolve success even when the server rejects (wrong recipient, not-a-member, already deleted).
4. **Blind edit/delete/react/reply.** UI has no way to show failure or re-sync a rejected optimistic state.

## How a mutation uses it

```ts
const { mutate } = useMutation({
    mutationFn: async ({ content, files }) => {
        const uploadIds = await messageService.uploadFiles(files);   // REST, cap 3
        await realtimeSocket.sendQueuedWithAck("channel.message.create", {
            workspaceId, channelId, content, uploadIds,
        });
    },
});
```

`sendQueuedWithAck` resolves only on the `.created` echo; the backend `error` frame rejects it; a disconnect rejects all pending; anything else surfaces via the provider as an unmatched error.

## Verification

- `npm run typecheck` — clean.
- `npm run build` — succeeds.
- New unit tests: `tests/realtime/ackTracker.test.ts` (match by key, reject on `success: false`, TIMEOUT, reject-all on disconnect, echo-before-register ordering), plus a socket test with a fake `WebSocket` (open → flush → ack resolve; close → reconnect; `sendWithAck` reject).
- Live check: two browser tabs, force a deny (react/delete someone else's message) and confirm the composer keeps content and surfaces the error frame.
