// FILE: controllers/posts_controller.ts
import postModel, { iPost } from "../models/posts_model";
import BaseController from "./base_controller";

class PostController extends BaseController<iPost> {
  constructor() {
    super(postModel);
  }

  // If you need specialized methods for posts, define them here.
}

export default new PostController();
