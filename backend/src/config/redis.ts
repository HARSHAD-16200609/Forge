import Redis from "ioredis";
import { env } from "./env";

const relayEnabled = env.REALTIME_RELAY_ENABLED === "true";

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

const createClient = () =>
  new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

export const isRelayEnabled = () => relayEnabled;

export function getPublisher(): Redis {
  if (!relayEnabled) throw new Error("Redis relay is disabled");
  if (!publisher) throw new Error("Redis clients not connected — call connectRedis() first");
  return publisher;
}

export function getSubscriber(): Redis {
  if (!relayEnabled) throw new Error("Redis relay is disabled");
  if (!subscriber) throw new Error("Redis clients not connected — call connectRedis() first");
  return subscriber;
}

export async function connectRedis(): Promise<boolean> {
  if (!relayEnabled) return false;
  try {
    publisher = createClient();
    subscriber = createClient();
    await publisher.connect();
    await subscriber.connect();
    return true;
  } catch (err) {
    stopRedis();
    console.error("Redis connection failed:", err);
    return false;
  }
}

export function stopRedis(): void {
  if (publisher) { publisher.disconnect(); publisher = null; }
  if (subscriber) { subscriber.disconnect(); subscriber = null; }
}