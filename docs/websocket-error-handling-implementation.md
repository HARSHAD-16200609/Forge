# WebSocket Error Handling — Implementation

Standardized error handling across the realtime WebSocket layer around a single `WsResponse` class, plus a fixed connection lifecycle so clients always receive a consistent, correlatable frame — and the server never leaks sockets/subscriptions.

## The wire contract

Every response (success or failure) is a single JSON frame with the same shape:

```json
{
  "type": "conversation.subscribe",
  "success": false,
  "message": "Invalid conversation payload",
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "errorMessage": "Invalid conversation payload"
  }
}
```

- `type` **echoes the originating event type** so the client can match a reply to the event it sent.
- `type: "error"` is only used when the original event type cannot be known (envelope parse failure).
- `success: false` is guaranteed whenever `error` is present — it cannot be set to `true` by accident.

### Error codes

| Code               | Used for                                                              |
|--------------------|-----------------------------------------------------------------------|
| `VALIDATION_ERROR` | Zod rejection of an envelope / handler payload (HTTP 400)             |
| `UNAUTHORIZED`     | Socket has no `ConnectionMetadata` (HTTP 401)                         |
| `FORBIDDEN`        | User is not a member of the conversation (HTTP 403)                   |
| `UNKNOWN_EVENT`    | Event type has no registered handler (HTTP 400)                       |
| `INTERNAL_ERROR`   | Any unhandled exception thrown inside a handler (HTTP 500, sanitized) |

## Files changed

| File                                  | Change                                                                 |
|---------------------------------------|------------------------------------------------------------------------|
| `websockets/utility/wsResponse.ts`    | Rebuilt: `WsResponse` factories + `sendWs` helper                      |
| `websockets/eventRouter.ts`           | Error funnel: `UNKNOWN_EVENT` + sanitized `INTERNAL_ERROR` frames      |
| `websockets/websocketServer.ts`       | Per-socket `close`/`error` cleanup; envelope errors via `sendWs`       |
| `websockets/handlers/conversationHandler.ts` | All sends via `WsResponse.ok/fail`; `success` flags corrected   |
| `websockets/types/websocketMessage.ts`| Removed the duplicate `WsResponse` interface (class is the source of truth) |
| `websockets/types/events.ts`          | Removed `InputValidation` / `CloseConnection`; kept `error` fallback   |
| `tests/unit/websockets/wsResponse.test.ts` | Added tests for the response contract, `sendWs`, and router errors |

## `WsResponse` API

```ts
class WsResponse {
  static ok(type: WsEvent, message?: string, statusCode?: number): WsResponse;
  static fail(type: WsEvent, statusCode: number, code: string, errorMessage: string): WsResponse;
}

function sendWs(ws: WebSocket, response: WsResponse): void;
```

- `WsResponse.ok(...)` → `success: true`.
- `WsResponse.fail(...)` → `success: false` + `error: { code, errorMessage }`; `message` is set to `errorMessage`.
- The constructor still exists for edge cases but **auto-derives `success`**: any frame carrying an `error` is always `success: false`.
- `sendWs` guards `ws.readyState === OPEN` before calling `ws.send`, so no caller sends onto a dead socket.

## Fixed bugs

1. **`success: true` on error frames.** `conversationHandler` previously sent validation and auth errors with `success: true`. The factory methods prevent this class of mistake.
2. **Broken close handler.** `websocketServer.on("close")` fired only on server shutdown and received no socket; it referenced an out-of-scope variable. Replaced with `ws.on("close")` inside the connection handler that runs `subscriptionManager.removeSocket(ws)` + `connectionManager.removeConnection(ws)` (audit-logged, error-safe).
3. **Unhandled socket errors.** Added `ws.on("error")`, which prevents Node from crashing on an unhandled `'error'` event.
4. **Duplicate `WsResponse` definitions.** The interface in `types/websocketMessage.ts` was removed; `utility/wsResponse.ts` is the single source of truth.
5. **Event enum doubling as error codes.** `WsEvent.InputValidation` / `WsEvent.CloseConnection` removed; machine-readable codes live in `error.code`.

## How to send responses in a handler

Success:

```ts
sendWs(ws, WsResponse.ok(message.type, "Conversation subscribed successfully"));
```

Failure (handlers return instead of throwing for expected errors):

```ts
sendWs(ws, WsResponse.fail(
  message.type,
  StatusCodes.BAD_REQUEST,
  "VALIDATION_ERROR",
  "Invalid conversation payload"
));
```

Unexpected exceptions should simply **throw** — `eventRouter.dispatch` catches them, logs the full stack (with `userId`) via `loggers.audit`, and replies with a sanitized `INTERNAL_ERROR` frame.

## Verification

- `npm run type-check` — passes.
- `npm test` — 17 tests across 3 files pass, including:
  - `WsResponse.ok` / `WsResponse.fail` shape and defaults;
  - the `success: false` auto-derivation rule;
  - `sendWs` no-op on a closed socket;
  - `UNKNOWN_EVENT` frame for unregistered event types;
  - `VALIDATION_ERROR` frame for a rejected `conversation.subscribe` payload.