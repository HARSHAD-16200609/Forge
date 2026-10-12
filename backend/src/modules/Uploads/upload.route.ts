import { Router } from "express";
import upload from "../../middlewares/multer.midleware";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { completeUpload, createUploadIntents, getWorkspaceFiles, uploadAttachments } from "./upload.controller";

export const uploadRouter = Router()

uploadRouter.route("/uploads").post(verifyJwt, upload.array("attachments", 3), uploadAttachments)
uploadRouter.route("/uploads/intents").post(verifyJwt, createUploadIntents)
uploadRouter.route("/uploads/:uploadId/complete").post(verifyJwt, completeUpload)
uploadRouter.route("/workspace/:workspaceId/files").get(verifyJwt, getWorkspaceFiles)