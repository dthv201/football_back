import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postsRoutes from "./routes/posts_route";
import commentsRoutes from "./routes/comments_route";
import authRoutes from "./routes/auth_route";
import fileRouter from "./routes/file_route";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import cors from "cors";

dotenv.config();

const app = express();

if (process.env.NODE_ENV == "development") {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Web Dev 2022 REST API",
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

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const initApp = async () => {
  return new Promise<Express>((resolve, reject) => {
    db.on("error", (err) => {
      console.error(err);
    });

    if (process.env.DB_CONNECTION === undefined) {
      console.error("MONGO_URI is not set");
      reject();
    } else {
      mongoose.connect(process.env.DB_CONNECTION).then(() => {
        console.log("initApp finish");

        app.use(cors());
        app.use(express.json()); // Parses JSON requests
        app.use(express.urlencoded({ extended: true })); // Parses form data

        app.use((req, res, next) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "*");
          res.setHeader("Access-Control-Allow-Headers", "*");
          next();
        });

        const delay = (req: Request, res: Response, next: NextFunction) => {
          const d = new Promise<void>((r) => setTimeout(() => r(), 2000));
          d.then(() => next());
        };

        app.use("/posts", delay, postsRoutes);
        app.use("/comments", delay, commentsRoutes);
        app.use("/auth", delay, authRoutes);
        app.use("/file", fileRouter);
        app.use("/public", express.static("public"));
        app.use("/storage", express.static("storage"));
        app.use("/uploads", express.static("uploads"));
        app.use(express.static("front"));

        resolve(app);
      });
    }
  });
};

export default initApp;