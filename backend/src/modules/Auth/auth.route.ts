import { Router } from "express"
import { verifyJwt } from "../../middlewares/verifyJwt";
import { Login, Logout,  RefreshAcessToken,  Register } from "./auth.controller";


const userRouter = Router();



userRouter.route("/auth/register").post(Register)

userRouter.route("/auth/login").post(Login)

userRouter.route("/auth/logout").post(verifyJwt, Logout)

userRouter.route("/auth/refresh").post(RefreshAcessToken)



export { userRouter }