import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { StatusCodes } from "http-status-codes"
import { loggers } from "../../utility/logger/serviceLoggers";
import { clearCookieOptions, accessCookieOptions, refreshCookieOptions } from "../../config/env";
import { authService } from "./auth.service";
import { cookieTokens, loginSchema, refreshToken, registerSchema, reqUserSchema } from "../../db/auth-schema";
import { UserInputValidationError } from "../../utility/errorHandling/customErrors";
import z from "zod";
import { idSchema } from "../../db/workspace";



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
  const userMetaData = {
   ip: req.ip ?? "",
   userAgent : req.get("user-agent") ?? "",
  }
  const sessionInfo = await authService.Login(result.data,userMetaData)

  loggers.auth.info("Login successful", {
    userId: sessionInfo?.userInfo.id || "",
    email: sessionInfo?.userInfo.email || "",
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.cookie("accessToken", sessionInfo?.accessToken, accessCookieOptions)
    .cookie("refreshToken", sessionInfo?.refreshToken, refreshCookieOptions)


  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {
    sucess: true,
    user:sessionInfo?.userInfo || {}
  }, "User Logged in Sucessfully"))


})

export const RefreshAcessToken = asyncHandler(async (req, res) => {
  const result = refreshToken.safeParse(req.cookies)

  if (!result.success) throw new UserInputValidationError("validation-error please check your Entered details", result.error.flatten().fieldErrors)
  const accessToken = await authService.Refresh(result.data.refreshToken)

  loggers.auth.info("AcessTokenRefreshed", {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    createdAt: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })
  })
  res.cookie("accessToken", accessToken, accessCookieOptions)
  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {}, "accessToken Generated Sucessfully"))
}

)

export const Logout = asyncHandler(async (req, res) => {

  const result = cookieTokens.safeParse(req.cookies)

  if (!result.success) throw new UserInputValidationError("validation-error please check your Entered details", result.error.flatten().fieldErrors)


  await authService.Logout(result.data.refreshToken)

  loggers.auth.info("Logout Successfully", {

    userId: req.user.userId,
    username: req.user.username,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  })
  res.clearCookie("accessToken", clearCookieOptions).clearCookie("refreshToken", clearCookieOptions)
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {}, "Logged Out Successfully"))

})

export const LogoutFromAllDevices = asyncHandler(async(req,res)=>{
      const result = reqUserSchema.safeParse(req.user)

  if (!result.success) throw new UserInputValidationError("validation-error please check your Entered details", result.error.flatten().fieldErrors)


  await authService.LogoutFromAllDevices(result.data.userId)
    loggers.auth.info("Logout Successfully", {

    userId: req.user.userId,
    username: req.user.username,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  })
  res.clearCookie("accessToken", clearCookieOptions).clearCookie("refreshToken", clearCookieOptions)
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {}, "Logged Out From all Devices"))
})

