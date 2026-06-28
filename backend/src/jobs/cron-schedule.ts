import cron  from "node-cron";
import { deleteExpiredInvite, expireInvite } from "./invite-cleanup-.cron";
import { deleteExpiredSession } from "./session-cleanup";


cron.schedule("0 */2 * * *",expireInvite)
cron.schedule("0 0 * * *",deleteExpiredInvite)
cron.schedule("0 * * * *",deleteExpiredSession)

