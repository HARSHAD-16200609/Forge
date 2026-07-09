import { StatusCodes } from "http-status-codes";
import { reqUserSchema } from "../../db/auth-schema";
import { createDMSchema } from "../../db/conversation.schema";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { conversationService } from "./conversations.service";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";

export const createDM = asyncHandler(async (req, res) => {

    const receiver = createDMSchema.safeParse(req.body)
    const user = reqUserSchema.safeParse(req.user)
    if (!user.success) throw new UserInputValidationError("Invalid Token", user.error.flatten().fieldErrors)
    if (!receiver.success) throw new UserInputValidationError("Invalid Input", receiver.error.flatten().fieldErrors)

    const dm = await conversationService.createDM(user.data.userId, receiver.data.receiverId)
    loggers.db.info("DM created SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        converastionId: "sf",
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, dm, "DM created Sucessfully"))

})