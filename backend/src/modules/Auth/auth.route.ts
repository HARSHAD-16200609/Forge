import { Router } from "express"
import { verifyJwt } from "../../middlewares/verifyJwt";
import { genState, getUser, handleGoogleCallBack, Login, Logout, LogoutFromAllDevices, RefreshAcessToken, Register } from "./auth.controller";


const userRouter = Router();



userRouter.route("/auth/register").post(Register)

userRouter.route("/auth/login").post(Login)

userRouter.route("/auth/logout").post(verifyJwt, Logout)
userRouter.route("/auth/logout-all").post(verifyJwt, LogoutFromAllDevices)
userRouter.route("/auth/user").get(verifyJwt, getUser)

userRouter.route("/auth/refresh").post(RefreshAcessToken)
userRouter.route("/auth/google").get(genState)
userRouter.get("/auth/google/callback",handleGoogleCallBack);



export { userRouter }