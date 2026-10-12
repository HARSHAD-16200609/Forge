import cron from "node-cron";
import { deleteExpiredChannelInvite, deleteExpiredWsInvite, expireChannelInvite, expireWsInvite } from "./invite-cleanup-.cron";
import { deleteExpiredSession } from "./session-cleanup";
import { cleanupDeletedMessages, cleanupExpiredPendingUploads } from "./message-cleanup";


cron.schedule("0 */2 * * *", expireWsInvite)
cron.schedule("0 0 * * *", deleteExpiredWsInvite)
cron.schedule("0 */2 * * *", expireChannelInvite)
cron.schedule("0 0 * * *", deleteExpiredChannelInvite)
cron.schedule("0 * * * *", deleteExpiredSession)
cron.schedule("*/30 * * * *", cleanupExpiredPendingUploads)
// cron.schedule("0 2 * * *",cleanupDeletedMessages)

