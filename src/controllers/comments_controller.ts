import { Request, Response } from "express";
import commentsModel, { IComment } from "../models/comments_model";

import BaseController from "./base_controller"; // Assuming you have a base controller

export class CommentsController extends BaseController<IComment> {
  constructor() {
    super(commentsModel);
}
async getCommentsByPostId(req: Request, res: Response){
  const postId = req.params.postId;
        try {
            if (postId) {
                const item = await this.model.find({ postId: postId });
                res.status(200).send(item);
            }
        } catch (error) {
            res.status(400).send(error);
        }
}
async getCommentsCount(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      if (!postId) {
        return res.status(400).json({ error: "postId is required" });
      }
      let count = await commentsModel.countDocuments({ postId: postId });
      if (count === undefined){
        count = 0;
      }
      res.status(200).json({ count });
    } catch (error) {
      res.status(500).json({ error: "Internal server error", details: error });
    }
  };

}
export default new CommentsController();
