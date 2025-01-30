import postModel, { iPost } from "../models/posts_model";
import { Request, Response } from "express";
import  BaseController  from "./base_controller";

class PostController extends BaseController<iPost> {
    constructor() {
        super(postModel);
    }


}

export default new PostController();