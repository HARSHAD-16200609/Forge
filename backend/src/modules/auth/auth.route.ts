import { Router } from "express"
import { verifyJwt } from "../../middlewares/verifyJwt";
import { Login, Logout,  RefreshAcessToken,  register } from "./auth.controller";


const userRouter = Router();



userRouter.route("/auth/register").post(register)

userRouter.route("/auth/login").post(Login)

userRouter.route("/auth/logout").post(verifyJwt, Logout)

userRouter.route("/auth/refresh").post(RefreshAcessToken)



export { userRouter }