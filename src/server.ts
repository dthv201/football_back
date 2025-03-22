// FILE: server.ts
import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import cors from "cors";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

import postsRoutes from "./routes/posts_route";
import commentsRoutes from "./routes/comments_route"; // optional
import authRoutes from "./routes/auth_route"; // optional
import fileRouter from "./routes/file_route"; // the file upload route

const app = express();

if (process.env.NODE_ENV === "development") {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "REST API",
        version: "1.0.0",
        description: "REST server including authentication using JWT",
      },
      servers: [{ url: "http://localhost:3000" }],
    },
    apis: ["./src/routes/*.ts"],
  };
  const specs = swaggerJsDoc(options);
  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
}

mongoose.connection.on("error", (error) => console.error(error));
mongoose.connection.once("open", () => console.log("Connected to database"));

async function initApp(): Promise<Express> {
  if (!process.env.DB_CONNECTION) {
    console.error("DB_CONNECTION is not set in your .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.DB_CONNECTION);
  console.log("Database connected.");

  // 1) Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 2) Static folder for uploaded images
  app.use("/uploads", express.static("uploads"));

  // 3) Additional middlewares or headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
  });

  // Optional "delay" middleware if you want to slow requests
  const delay = (req: Request, res: Response, next: NextFunction) => {
    setTimeout(() => next(), 2000);
  };

  // 4) Mount routes
  app.use("/file", fileRouter);
  app.use("/posts", delay, postsRoutes);
  app.use("/comments", delay, commentsRoutes); // optional
  app.use("/auth", delay, authRoutes); // optional

  // 5) Serve any static front-end (optional)
  app.use(express.static("front"));

  return app;
}

// Start server (if not in test mode)
if (require.main === module) {
  initApp().then((app) => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  });
}

export default initApp;
