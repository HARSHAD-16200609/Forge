import cron  from "node-cron";
import { deleteExpiredInvite, expireInvite } from "./invite-cleanup-.cron";

cron.schedule("0 */2 * * *",expireInvite)
cron.schedule("0 0 * * *",deleteExpiredInvite)


