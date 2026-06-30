import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { createChannel, getChannel, getChannels, updateChannel } from "./channel.controller";


const channelRouter = Router()


channelRouter.route("/workspace/:id/channels").post(verifyJwt,createChannel)
channelRouter.route("/workspace/:id/channels").get(verifyJwt,getChannels)
channelRouter.route("/workspace/:workspaceId/channels/:channelId").get(verifyJwt,getChannel)
channelRouter.route("/workspace/:workspaceId/channels/:channelId").put(verifyJwt,updateChannel)



export {channelRouter}