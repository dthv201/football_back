import postModel, { iPost } from "../models/posts_model";
import userModel, { SkillLevel } from "../models/users_model";
import { Request, Response } from "express";
import BaseController from "./base_controller";
import { Player, splitUsersIntoBalancedTeams } from "../services/generativeAIService";

class PostController extends BaseController<iPost> {
    constructor() {
        super(postModel);
    }

    async addParticipant(req: Request, res: Response) {
        try {
            const { postId, participantId } = req.body;

            if (!postId || !participantId) {
                res.status(400).json({ error: "Missing postId or participantId" });
                return;
            }

            const post = await postModel.findById(postId);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return
            }

            if (post.participantsIds?.includes(participantId)) {
                res.status(400).json({ error: "Participant already added" });
                return;
            }

            post.participantsIds?.push(participantId);
            await post.save();

            res.status(200).json({ message: "Participant added successfully", post });
        } catch (error) {
            res.status(500).json({ error: "Internal server error", details: error });
        }
    }

    async removeParticipant(req: Request, res: Response) {
        try {
            const { postId, participantId } = req.body;

            if (!postId || !participantId) {
                res.status(400).json({ error: "Missing postId or participantId" });
                return;
            }

            const post = await postModel.findById(postId);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }

            if (!post.participantsIds?.includes(participantId)) {
                res.status(400).json({ error: "Participant not found in the group" });
                return;
            }

            post.participantsIds = post.participantsIds.filter(id => id !== participantId);
            await post.save();

            res.status(200).json({ message: "Participant removed successfully", post });
        } catch (error) {
            res.status(500).json({ error: "Internal server error", details: error });
        }
    }

    async splitParticipantsIntoTeams(req: Request, res: Response) {
        try {
            const { postId } = req.body;

            if (!postId) {
                res.status(400).json({ message: "postId is required" });
                return;
            }

            const post = await postModel.findById(postId).populate("participantsIds");

            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }

            if (!post.participantsIds || post.participantsIds.length < 2) {
                res.status(400).json({ message: "Not enough participants to create teams" });
                return;
            }

            const participants = await userModel.find({ _id: { $in: post.participantsIds } });

            if (!participants.length) {
                res.status(404).json({ message: "No participants found" });
                return;
            }

            const players: Player[] = participants.map((participant) => ({
                _id: participant._id.toString(),
                username: participant.username,
                skillLevel: participant.skillLevel?.toString() || SkillLevel.INTERMEDIATE.toString(),
            }));

            const result = await splitUsersIntoBalancedTeams(players);

            if (!result) {
                res.status(500).json({ message: "Failed to split users into teams" });
                return;
            }

            res.status(200).json({
                message: "Teams split successfully",
                teams: result,
            });
        } catch (error) {
            console.error("Error splitting teams:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export default new PostController();