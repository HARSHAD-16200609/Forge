import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { createChannel, deleteChannel, getChannel, getChannels, joinChannel, updateChannel } from "./channel.controller";


const channelRouter = Router()


channelRouter.route("/workspace/:id/channels").post(verifyJwt,createChannel)
channelRouter.route("/workspace/:id/channels").get(verifyJwt,getChannels)
channelRouter.route("/workspace/:workspaceId/channels/:channelId").get(verifyJwt,getChannel)
channelRouter.route("/workspace/:workspaceId/channels/:channelId").patch(verifyJwt,updateChannel)
channelRouter.route("/workspace/:workspaceId/channels/:channelId").delete(verifyJwt,deleteChannel)
channelRouter.route("/workspace/:workspaceId/channels/:channelId").post(verifyJwt,joinChannel)





export {channelRouter}