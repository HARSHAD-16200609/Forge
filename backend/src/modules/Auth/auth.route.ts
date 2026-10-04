import { Router } from "express"
import { verifyJwt } from "../../middlewares/verifyJwt";
import { handleGithubLogin, handleGithubCallback, getUser, handleGoogleCallBack, handleGoogleLogin, Login, Logout, LogoutFromAllDevices, RefreshAcessToken, Register, rerollAvatar, uploadAvatar, removeAvatar } from "./auth.controller";
import { avatarUpload } from "../../middlewares/multer.midleware";


const userRouter = Router();



userRouter.route("/auth/register").post(Register)

userRouter.route("/auth/login").post(Login)

userRouter.route("/auth/logout").post(verifyJwt, Logout)
userRouter.route("/auth/logout-all").post(verifyJwt, LogoutFromAllDevices)
userRouter.route("/auth/user").get(verifyJwt, getUser)
userRouter.route("/auth/user/avatar").post(verifyJwt, avatarUpload.single("avatar"), uploadAvatar).delete(verifyJwt, removeAvatar)
userRouter.route("/auth/user/avatar/reroll").post(verifyJwt, rerollAvatar)

userRouter.route("/auth/refresh").post(RefreshAcessToken)
userRouter.route("/auth/google").get(handleGoogleLogin)
userRouter.get("/auth/google/callback",handleGoogleCallBack);
userRouter.route("/auth/github").get(handleGithubLogin)
userRouter.get("/auth/github/callback",handleGithubCallback);






export { userRouter }