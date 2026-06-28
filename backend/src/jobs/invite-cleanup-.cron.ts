import { subDays, subMinutes } from "date-fns";
import { Status } from "../../generated/prisma/enums";
import { prisma } from "../config/prisma"
import { asyncHandler } from "../utility/errorHandling/asyncHandler"
import cron from "node-cron"
import { loggers } from "../utility/logger/serviceLoggers";


export const expireInvite = (async () => {
    console.log("Cron started")
 const startedAt = new Date()
    await prisma.workspaceInvite.updateMany({
        where: {
            expiresAt: {
                lt: new Date()
            }
        }, data: {
            status: "EXPIRED"
        }
    })
    const finishedAt = new Date()

    loggers.audit.info("CRON_MARKED_PENDING_INVITES_EXPIRED", {
        action: "CRON_INVITE_EXPIRATION",
        status: "SUCCESS",
        affectedRecords: 12,
         startedAt,
        finishedIn: (startedAt.getTime()-finishedAt.getTime()) / (60*1000)
    })

})


export const deleteExpiredInvite = (async () => {
    console.log("cron Deletion started")
 const startedAt = new Date()
    await prisma.workspaceInvite.deleteMany({
        where: {
            status: Status.EXPIRED,
            expiresAt: {
                lt: subDays(new Date(),30),
            },
        },
    });
       const finishedAt = new Date()
     loggers.audit.info("CRON_DELETED_MARKED_PENDING_INVITES_EXPIRED", {
        action: "CRON_INVITE_EXPIRATION",
        status: "SUCCESS",
        affectedRecords: 12,
         startedAt,
        finishedIn: (startedAt.getTime()-finishedAt.getTime()) / (60*1000)
    })
})



