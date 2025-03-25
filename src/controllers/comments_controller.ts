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
                res.send(item);
            } else {
                const items = await this.model.find();
                res.status(200).send(items);
            }
        } catch (error) {
            res.status(400).send(error);
        }
}

}
export default new CommentsController();
