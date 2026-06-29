import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { createChannel, getChannels } from "./channel.controller";


const channelRouter = Router()


channelRouter.route("/workspace/:id/channels").post(verifyJwt,createChannel)
channelRouter.route("/workspace/:id/channels").get(verifyJwt,getChannels)



export {channelRouter}