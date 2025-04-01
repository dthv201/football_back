import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import commentsModel from "../models/comments_model";
import { CommentsController } from '../controllers/comments_controller';
import { Express } from "express";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

let app: Express;
let accessToken: string; 
let commentId = "";

const testComment = {
  comment: "This is a test comment",
  postId: "676aed82c92c60d154870c7d",
  owner: "Test Owner",
};

const invalid2 = {
  comment: "This is a test comment",
  owner: "Test Owner",
}
const invalidComment = {
  comment: "This is a test comment",
  postId: "676aed82c92c60d154870c7d",
};


beforeAll(async () => {
  app = await initApp();
  console.log("beforeAll");
  await commentsModel.deleteMany({});
  
  const payload = { _id: "testUserId", email: "test@example.com" };
  const secret = process.env.TOKEN_SECRET || "defaultSecret";
  accessToken = jwt.sign(payload, secret, { expiresIn: process.env.TOKEN_EXPIRES });
});
  
afterAll(async () => {
  console.log("afterAll");
  await mongoose.connection.close();
});



describe("Comments test suite", () => {
  test("Comment test get all comments initially empty", async () => {
    const response = await request(app)
      .get("/comments")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  test("Create a new comment with auth", async () => {
    const response = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testComment)
      .expect(201);

    expect(response.body).toHaveProperty("_id");
    expect(response.body.comment).toBe(testComment.comment);
    expect(response.body.postId).toBe(testComment.postId);
    expect(response.body.owner).toBe(testComment.owner);

    commentId = response.body._id;
  });

  test("Get all comments after adding with auth", async () => {
    const response = await request(app)
      .get("/comments")
      .set("Authorization", `Bearer ${accessToken}`); 

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  test("Get a comment by ID with auth", async () => {
    const response = await request(app)
      .get(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("_id", commentId);
    expect(response.body.comment).toBe(testComment.comment);
    expect(response.body.postId).toBe(testComment.postId);
    expect(response.body.owner).toBe(testComment.owner);
  });

    test("Comment test get all comments by owner", async () => {
      const response = await request(app)
      .get(`/comments?owner=${testComment.owner}`)
      .set("Authorization", `Bearer ${accessToken}`);
      expect(response.statusCode).toBe(200);
    });

    test("Get all the comment by the postId", async () => {
      const response = await request(app)
        .get(`/comments/posts/${testComment.postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
    });


    test("Get the count of comments with no postId", async () => {
      const response = await request(app)
        .get(`/comments/countComments`)
        .set("Authorization", `Bearer ${accessToken}`)
      expect(response.statusCode).toBe(400);
    
    });
    
    test("Get the count of comments by postId", async () => {
      const response = await request(app)
        .get(`/comments/countComments/${testComment.postId}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("count", 1);
    });




    test("Update a comment with auth", async () => {
      const updatedComment = {
        comment: "Updated comment",
        postId: "1234567890abcdef12345678",
        owner: "Updated Owner",
      };
  
      const response = await request(app)
        .put(`/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updatedComment)
        .expect(200);
  
      expect(response.body).toHaveProperty("_id", commentId);
      expect(response.body.comment).toBe(updatedComment.comment);
      expect(response.body.postId).toBe(updatedComment.postId);
      expect(response.body.owner).toBe(updatedComment.owner);
    });

  

    

    test("Delete a comment successfully with auth", async () => {
      const response = await request(app)
        .delete(`/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`); 
  
      expect(response.statusCode).toBe(204);
  
      const response2 = await request(app)
        .get(`/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`);
  
      expect(response2.statusCode).toBe(404);
    });
  
    test("Delete a comment without auth", async () => {
      const response = await request(app).delete(`/comments/${commentId}`); 
      expect(response.statusCode).toBe(401);
    });




    test("Delete a non-existent comment with auth", async () => {
      const response = await request(app)
        .delete(`/comments/${testComment.postId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty("message", "not found");
    });

    


  
  

});

