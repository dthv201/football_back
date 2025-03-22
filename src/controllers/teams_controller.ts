import { Request, Response } from "express";
import Team, {ITeam} from "../models/team_model";
import User from "../models/users_model";
import  BaseController  from "./base_controller";

class TeamController extends BaseController<ITeam> {
    constructor() {
        super(Team);
    }
}

export default new TeamController();

// class TeamController {

  

//   async createTeam(req: Request, res: Response) {
//     try {
//       const { name, maxPlayers } = req.body;
//       const userId = (req as any).user.userId;
  
//       const existingTeam = await Team.findOne({ name });
//       if (existingTeam) {
//         res.status(400).json({ message: "Team name already exists" });
//       }
  
//       const newTeam = new Team({
//         name,
//         manager: userId,
//         players: [userId], // המנהל הוא גם השחקן הראשון
//         maxPlayers: maxPlayers || 10,
//       });
  
//       await newTeam.save();
//       res.status(201).json({ message: "Team created successfully", team: newTeam });
//     } catch (error) {
//       res.status(500).json({ message: "Server error" });
//     }
//   };
  
//   async joinTeam(req: Request, res: Response) {
//     try {
//       const { teamId } = req.body;
//       const userId = (req as any).user.userId;
  
//       const team = await Team.findById(teamId);
//       if (!team) {
//         res.status(404).json({ message: "Team not found" });
//         return;
//       }
  
//       if (team.players.length >= team.maxPlayers) {
//         res.status(400).json({ message: "Team is full" });
//         return;
//       }
  
//       if (team.players.includes(userId)) {
//         res.status(400).json({ message: "You are already in this team" });
//         return;
//       }
  
//       team.players.push(userId);
//       await team.save();
  
//       res.json({ message: "Joined team successfully", team });
//     } catch (error) {
//       res.status(500).json({ message: "Server error" });
//     }
//   };
  
//   async getTeams(req: Request, res: Response) {
//     try {
//       const teams = await Team.find().populate("manager", "name").populate("players", "name");
//       res.json(teams);
//     } catch (error) {
//       res.status(500).json({ message: "Server error" });
//     }
//   };

// }

// export default new TeamController();



