import { userRouter } from "../modules/Auth/auth.route"
import { workspaceRouter } from "../modules/Workspace/workspace.route"
import { channelRouter } from "../modules/Channel/channel.route"
import { inviteRouter } from "../modules/Invitation/invitation.route"
import Router from "express"
import { messageRouter } from "../modules/Messages/message.route"



const apiRouter = Router()



apiRouter.use(userRouter)
apiRouter.use(workspaceRouter)
apiRouter.use(channelRouter)
apiRouter.use(inviteRouter)
apiRouter.use(messageRouter)

export { apiRouter }

