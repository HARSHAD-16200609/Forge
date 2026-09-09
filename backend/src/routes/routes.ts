import { userRouter } from "../modules/Auth/auth.route"
import { workspaceRouter } from "../modules/Workspace/workspace.route"
import { channelRouter } from "../modules/Channel/channel.route"
import { inviteRouter } from "../modules/Invitation/invitation.route"
import Router from "express"
import { messageRouter } from "../modules/Messages/message.route"
import { conversationRouter } from "../modules/Conversations/conversations.route"
import { uploadRouter } from "../modules/Messages/upload.route"



const apiRouter = Router()



apiRouter.use(userRouter)
apiRouter.use(workspaceRouter)
apiRouter.use(channelRouter)
apiRouter.use(inviteRouter)
apiRouter.use(messageRouter)
apiRouter.use(conversationRouter)
apiRouter.use(uploadRouter)

export { apiRouter }

