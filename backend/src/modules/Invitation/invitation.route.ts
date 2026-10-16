import { Router } from "express"
import { verifyJwt } from "../../middlewares/verifyJwt"
import { acceptChannelInvite, acceptInviteToken, acceptWsInvite, cancelChannelInvite, cancelWsInvite, createChannelInvite, createWorkspaceInvite, createWorkspaceInviteLink, getWorkspaceInviteLink, listAllChannelInvites, listAllInvites, previewInviteToken, rejectChannelInvite, rejectWsInvite, revokeWorkspaceInviteLink } from "./invitation.controller"

const inviteRouter = Router()



inviteRouter.route("/workspace/:id/invites").post(verifyJwt, createWorkspaceInvite)
inviteRouter.route("/workspace/invites/list").get(verifyJwt, listAllInvites)
inviteRouter.route("/workspace-invites/:id/accept").post(verifyJwt, acceptWsInvite)
inviteRouter.route("/workspace-invites/:id/reject").post(verifyJwt, rejectWsInvite)
inviteRouter.route("/workspace-invites/:id/cancel").post(verifyJwt, cancelWsInvite)
inviteRouter.route("/workspace/:workspaceId/channel/:channelId/invites/").post(verifyJwt, createChannelInvite)
inviteRouter.route("/channels/invites/list").get(verifyJwt, listAllChannelInvites)
inviteRouter.route("/workspaces/:workspaceId/channel-invites/:inviteId/accept").post(verifyJwt,acceptChannelInvite)
inviteRouter.route("/workspaces/:workspaceId/channel-invites/:inviteId/reject").post(verifyJwt,rejectChannelInvite)
inviteRouter.route("/workspaces/:workspaceId/channel-invites/:inviteId/cancel").post(verifyJwt,cancelChannelInvite)
inviteRouter.route("/workspace/:id/invite-link").get(verifyJwt, getWorkspaceInviteLink)
inviteRouter.route("/workspace/:id/invite-link").post(verifyJwt, createWorkspaceInviteLink)
inviteRouter.route("/workspace/:id/invite-link/revoke").post(verifyJwt, revokeWorkspaceInviteLink)
inviteRouter.route("/invites/:token").get(previewInviteToken)
inviteRouter.route("/invites/:token/accept").post(verifyJwt, acceptInviteToken)





export { inviteRouter }
