import express from "express";
import auth_controller, { authMiddleware } from "../controllers/auth_controller";
import teamController from "../controllers/teams_controller";

const router = express.Router();

router.get("/", authMiddleware, teamController.getTeams);
router.post("/create", authMiddleware, teamController.createTeam);

router.post("/join", authMiddleware, teamController.joinTeam);


export default router;
