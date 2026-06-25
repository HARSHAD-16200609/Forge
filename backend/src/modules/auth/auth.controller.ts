import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { StatusCodes } from "http-status-codes"
import { loggers } from "../../utility/logger/serviceLoggers";
import { clearCookieOptions, env, setCookieOptions } from "../../config/env";
import { authService } from "./auth.service";
import { loginSchema, registerSchema } from "../../db/auth-schema";
import { UserInputValidationError } from "../../utility/errorHandling/customErrors";
import z from "zod";



export const Register = asyncHandler(async (req, res) => {
  const result = registerSchema.safeParse(req.body);

        if (!result.success) {

            throw new UserInputValidationError("validation-error please check your Entered details", result.error.flatten().fieldErrors)
        }

  const user = await authService.Register(result.data)

  if (user !== undefined) {
    loggers.auth.info("Registration successful", {
      username: user.username,
      email: user.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, { user }, "User Registered Sucessfully..."))

  }

})

export const Login = asyncHandler(async (req, res) => {
    const result = loginSchema.safeParse(req.body);

        if (!result.success) {

            throw new UserInputValidationError("validation-error please check your Entered details", result.error.flatten().fieldErrors)
        }
  const sessionInfo = await authService.Login(result.data)

  loggers.auth.info("Login successful", {
    userId: sessionInfo?.userId,
    email: sessionInfo?.email,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.cookie("accessToken", sessionInfo?.accessToken, setCookieOptions)
    .cookie("refreshToken", sessionInfo?.refreshToken, setCookieOptions)


  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {
    sucess: true,
  }, "User Logged in Sucessfully"))


})

export const RefreshAcessToken = asyncHandler(async (req, res) => {

  const accessToken = await authService.Refresh(req.cookies)

  loggers.auth.info("AcessTokenRefreshed", {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    createdAt: new Date()
  })
  res.cookie("accessToken", accessToken, setCookieOptions)
  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {}, "accessToken Generated Sucessfully"))
}

)

export const Logout = asyncHandler(async (req, res) => {
 const userIDSchema = z.uuid()
 const result  = userIDSchema.safeParse(req.user)

 if(!result.success) throw new UserInputValidationError("validation-error please check your Entered details", result.error.flatten())


  await authService.Logout(result.data)

  loggers.auth.info("Logout Successfully", {

    userId: req.user.userId,
    username: req.user.username,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  })
  res.clearCookie("accessToken", clearCookieOptions).clearCookie("refreshToken", clearCookieOptions)
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {}, "Logged Out Successfully"))

})



