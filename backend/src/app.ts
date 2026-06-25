import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import {env} from "./config/env"
import { globalErrorMiddleware } from "./middlewares/globalErrorHandler";
const app = express();
import { stream } from "./utility/logger/stream";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import { userRouter } from "./modules/auth/auth.route";
import { workspaceRouter } from "./modules/Workspace/workspace.route";



app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);


if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined",{stream}));
}




app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loggerMiddleware)

app.get("/health", (req, res) => {
  
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    
  });
});

app.use("/api/v1",userRouter,workspaceRouter)


app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(globalErrorMiddleware);

export default app;