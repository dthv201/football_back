import express from "express";
// import { authMiddleware } from "../middleware/authMiddleware";
import auth_controller, { authMiddleware } from "../controllers/auth_controller";
import teamController from "../controllers/teams_controller";

const router = express.Router();

router.post("/create", authMiddleware, teamController.createTeam);

router.post("/join", authMiddleware, teamController.joinTeam);

router.get("/", authMiddleware, teamController.getTeams);

export default router;
