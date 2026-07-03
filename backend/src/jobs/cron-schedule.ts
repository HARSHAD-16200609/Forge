import cron from "node-cron";
import { deleteExpiredChannelInvite, deleteExpiredWsInvite, expireChannelInvite, expireWsInvite } from "./invite-cleanup-.cron";
import { deleteExpiredSession } from "./session-cleanup";


cron.schedule("0 */2 * * *", expireWsInvite)
cron.schedule("0 0 * * *", deleteExpiredWsInvite)
cron.schedule("0 */2 * * *", expireChannelInvite)
cron.schedule("0 0 * * *", deleteExpiredChannelInvite)
cron.schedule("0 * * * *", deleteExpiredSession)

