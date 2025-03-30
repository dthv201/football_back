import postModel, { iPost } from "../models/posts_model";
import userModel, { SkillLevel } from "../models/users_model";
import { Request, Response } from "express";
import BaseController from "./base_controller";
import { Player, splitUsersIntoBalancedTeams } from "../services/generativeAIService";

class PostController extends BaseController<iPost> {
  constructor() {
    super(postModel);
  }

  // Add a participant to a post
  async addParticipant(req: Request, res: Response) {
    try {
      const { postId, userId } = req.body;
      if (!postId || !userId) {
        res.status(400).json({ error: "Missing postId or participantId" });
        return;
      }
      const post = await postModel.findById(postId);
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      if (post.participantsIds?.includes(userId)) {
        res.status(400).json({ error: "Participant already added" });
        return;
      }
      post.participantsIds?.push(userId);
      await post.save();
      res.status(200).json({ message: "Participant added successfully", post });
    } catch (error) {
      res.status(500).json({ error: "Internal server error", details: error });
    }
  }

  // Remove a participant from a post
  async removeParticipant(req: Request, res: Response) {
    try {
      const { postId, userId } = req.body;
      if (!postId || !userId) {
        res.status(400).json({ error: "Missing postId or participantId" });
        return;
      }
      const post = await postModel.findById(postId);
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      if (!post.participantsIds?.includes(userId)) {
        res.status(400).json({ error: "Participant not found in the group" });
        return;
      }
      post.participantsIds = post.participantsIds.filter(id => id !== userId);
      await post.save();
      res.status(200).json({ message: "Participant removed successfully", post });
    } catch (error) {
      res.status(500).json({ error: "Internal server error", details: error });
    }
  }

  // Split post participants into balanced teams
  async splitParticipantsIntoTeams(req: Request, res: Response) {
    try {
      const { postId } = req.body;
      if (!postId) {
        res.status(400).json({ message: "postId is required" });
        return;
      }
      const post = await postModel.findById(postId);
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
        _id: participant._id,
        username: participant.username,
        skillLevel: participant.skillLevel?.toString() || SkillLevel.INTERMEDIATE.toString(),
      }));
      const result = await splitUsersIntoBalancedTeams(players);
      post.teamA = result?.teamA.map(player => player._id?.toString()).filter((id): id is string => id !== undefined);
      post.teamB = result?.teamB.map(player => player._id?.toString()).filter((id): id is string => id !== undefined);
      await post.save();
      if (!result) {
        res.status(500).json({ message: "Failed to split users into teams" });
        return;
      }
      res.status(200).json(post);
    } catch (error) {
      console.error("Error splitting teams:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async handleLike(req: Request, res: Response): Promise<void> {
    const { postId, userId } = req.body;
    
    try {
        const post = await this.model.findById(postId);
        if (!post) {
            res.status(404).send('Post not found');
            return;
        }

        if (post.likesUsersIds?.includes(userId)) {
            post.likesUsersIds = post.likesUsersIds.filter(
                (id: any) => id.toString() !== req.body.userId.toString()
            ) as any;
        } else {
            post.likesUsersIds?.push(req.body.userId);
        }
        post.likes_number = post.likesUsersIds?.length;

        await post.save();
        res.status(200).send(post);
    } catch (error) {
        res.status(400).send(error);
    }
}
}

export default new PostController();
