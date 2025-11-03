import fs from "fs";
import https from "https";

import cors from "cors";
import express from "express";
import session from "express-session";
import memoryStore from "memorystore";
import morgan from "morgan";

import cookieParser from "cookie-parser";
import * as authController from "./controllers/authentication";
import * as registrationController from "./controllers/registration";
import { expectedOrigin } from "./libs/auth";

const app = (function createApp() {
  const { SESSION_SECRET = "MY_VERY_VERY_SECRET_:P" } = process.env;

  const expressApp = express();
  const MemoryStore = memoryStore(session);

  expressApp.use(morgan("dev"));
  expressApp.use(express.json());
  expressApp.use(cookieParser());
  expressApp.use(
    cors({
      origin: expectedOrigin,
      credentials: true,
      allowedHeaders: ["Content-Type"],
    })
  );
  expressApp.use(
    session({
      secret: SESSION_SECRET,
      saveUninitialized: true,
      resave: false,
      cookie: {
        maxAge: 86_400_000,
        httpOnly: true, // Ensure to not expose session cookies to client_side scripts
        secure: true,
      },
      store: new MemoryStore({
        checkPeriod: 86_400_000, // prune expired entries every 24h
      }),
    })
  );

  return expressApp;
})();

(function setupAppRoutes() {
  /**
   * Registration (WebAuthn 등록)
   */
  app.get(
    "/web-authn/registration/generate-options",
    registrationController.generateOptions
  );
  app.post("/web-authn/registration/verify", registrationController.verify);

  /**
   * Authentication (WebAuthn 로그인)
   */
  app.get(
    "/web-authn/authentication/generate-options",
    authController.generateOptions
  );
  app.post("/web-authn/authentication/verify", authController.verify);
})();

(function startAppServer() {
  const host = "127.0.0.1";
  const port = 3001; // HTTPS는 기본적으로 443 포트를 사용하지만, 개발용으로 3001 유지 가능

  // 1. 인증서 파일 읽기
  const options = {
    // 🚨 파일 경로는 실제 프로젝트에 맞게 수정하세요!
    key: fs.readFileSync("./localhost+1-key.pem"),
    cert: fs.readFileSync("./localhost+1.pem"),
  };

  // 2. https.createServer를 사용하여 서버 생성 및 리스닝
  https.createServer(options, app).listen(port, host, () => {
    // 이제 URL은 HTTPS로 시작해야 합니다.
    console.log(`🚀 Server ready at https://${host}:${port}`);
    console.log(`(Origin: https://localhost:${port})`);
  });
})();
