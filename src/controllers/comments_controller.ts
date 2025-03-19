import { Request, Response } from "express";
import commentsModel, { IComment } from "../models/comments_model";

import BaseController from "./base_controller"; // Assuming you have a base controller

export class CommentsController extends BaseController<IComment> {
  constructor() {
    super(commentsModel);
}
async getCommentsByPostId(req: Request, res: Response): Promise<Response> {
  try {
    const { postId } = req.params;
    const comments = await commentsModel.find({ postId });
    console.log("Fetched comments:", comments); 
    return res.status(200).json(comments); 
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

}
export default new CommentsController();
