import { Router } from "express";
import { uploadOnCloudinary } from "../../config/cloudinary";
import upload from "../../middlewares/multer.midleware";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { uploadAttachments } from "./upload.controller";

export const uploadRouter = Router()



uploadRouter.route("/uploads").post(verifyJwt,upload.array("attachments",3),uploadAttachments)

