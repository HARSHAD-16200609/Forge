import { afterEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";

import { verifyAccessToken } from "../../../src/utility/auth/jwt";
import { UnauthorizedAccessError } from "../../../src/utility/errorHandling/customErrors";

const secret = process.env.TEST_JWT_SECRET!;

describe("verifyAccessToken", () => {
    
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the decoded payload for a valid token", async () => {
    const payload = {
      userId: "user-123",
      username: "harshad",
      sessionId: "session-123",
    };

    const token = jwt.sign(payload, secret, {
      expiresIn: "15m",
    });

    await expect(
      verifyAccessToken(token, secret)
    ).resolves.toMatchObject(payload);
  });

  it("throws UnauthorizedAccessError when the token is expired", async () => {
    vi.useFakeTimers();

    const now = new Date();
    vi.setSystemTime(now);

    const token = jwt.sign(
      { userId: "123" },
      secret,
      { expiresIn: "1s" }
    );

    vi.setSystemTime(new Date(now.getTime() + 1500));

    await expect(
      verifyAccessToken(token, secret)
    ).rejects.toBeInstanceOf(UnauthorizedAccessError);
  });

  it("throws UnauthorizedAccessError when signed with another secret", async () => {
    const token = jwt.sign(
      { userId: "123" },
      "another-secret"
    );

    await expect(
      verifyAccessToken(token, secret)
    ).rejects.toBeInstanceOf(UnauthorizedAccessError);
  });

  it("throws UnauthorizedAccessError for a malformed token", async () => {
    await expect(
      verifyAccessToken("this.is.not.a.jwt", secret)
    ).rejects.toBeInstanceOf(UnauthorizedAccessError);
  });

  it("throws UnauthorizedAccessError for an empty token", async () => {
    await expect(
      verifyAccessToken("", secret)
    ).rejects.toBeInstanceOf(UnauthorizedAccessError);
  });

  it("throws UnauthorizedAccessError for a whitespace token", async () => {
    await expect(
      verifyAccessToken("   ", secret)
    ).rejects.toBeInstanceOf(UnauthorizedAccessError);
  });

  it("throws UnauthorizedAccessError when the token is truncated", async () => {
    const token = jwt.sign(
      { userId: "123" },
      secret
    );

    const truncated = token.slice(0, -10);

    await expect(
      verifyAccessToken(truncated, secret)
    ).rejects.toBeInstanceOf(UnauthorizedAccessError);
  });
});