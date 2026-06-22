import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import {env} from "./config/env"
const app = express();



app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);


if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
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


app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});



app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});



export default app;