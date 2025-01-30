import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/posts_model";
import { Express } from "express";
import jwt from "jsonwebtoken";

let app: Express;
let accessToken: string;

beforeAll(async () => {
  app = await initApp();
  console.log("beforeAll");
  await postModel.deleteMany();

  const payload = { _id: "testUserId", email: "test@example.com" };
  const secret = process.env.TOKEN_SECRET || "defaultSecret";
  accessToken = jwt.sign(payload, secret, { expiresIn: process.env.TOKEN_EXPIRES });
});

afterAll(async () => {
  console.log("afterAll");
  await mongoose.connection.close();
});

var postId = "";
const testPost = {
  title: "Test title",
  content: "Test content",
  owner: "Lior",
};
const invalidPost = {
  title: "Test title",
  content: "Test content",
};

describe("Posts test suite", () => {
  
  test("Fail to get all posts without token", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(401); // Access Denied
  });

  test("Get all posts with valid token", async () => {
    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  test("Add new post with valid token", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testPost);
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(testPost.title);
    expect(response.body.content).toBe(testPost.content);
    expect(response.body.owner).toBe(testPost.owner);
    postId = response.body._id;
  });

  test("Add new post without token", async () => {
    const response = await request(app).post("/posts").send(testPost);
    expect(response.statusCode).toBe(401);
  });

  test("Get all posts after adding with valid token", async () => {
    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
  });


  test("Test get post by owner with auth", async () => {
    const response = await request(app)
      .get(`/posts?owner=${testPost.owner}`)
      .set("Authorization", `Bearer ${accessToken}`); 
  
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].owner).toBe(testPost.owner);
  });
  

  test("Get post by ID with valid token", async () => {
    const response = await request(app)
      .get(`/posts/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(postId);
  });

  test("Test get post by id fail", async () => {
    const response = await request(app)
    .get("/posts/67447b032ce3164be7c4412d")
    .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(404);
  });

  test("Get post by ID without token", async () => {
    const response = await request(app).get(`/posts/${postId}`);
    expect(response.statusCode).toBe(401);
  });

  test("Test updating a post with auth", async () => {
    const updatedPost = {
      title: "Updated title",
      content: "Updated content",
    };
  
    const response = await request(app)
      .put(`/posts/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`) // הוספת כותרת Authorization עם הטוקן
      .send(updatedPost);
  
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(updatedPost.title);
    expect(response.body.content).toBe(updatedPost.content);
  });
  
  test("Test updating a post without auth", async () => {
    const updatedPost = {
      title: "Updated title",
      content: "Updated content",
    };
  
    const response = await request(app)
      .put(`/posts/${postId}`)
      .send(updatedPost); 
    expect(response.statusCode).toBe(401);
  });


  test("Test Delete a post in success with auth", async () => {
    const response = await request(app)
      .delete("/posts/" + postId)
      .set("Authorization", `Bearer ${accessToken}`);
  
    expect(response.statusCode).toBe(204);
  
    const response2 = await request(app)
      .get("/posts/" + postId)
      .set("Authorization", `Bearer ${accessToken}`); 
  
    expect(response2.statusCode).toBe(404);
  });
  
  test("Test Delete a post without auth", async () => {
    const response = await request(app).delete("/posts/" + postId); 
    expect(response.statusCode).toBe(401);
  });
  
  test("Test not found updating a post with auth", async () => {
    const updatedPost = {
      title: "Updated title",
      content: "Updated content",
    };
  
    const response = await request(app)
      .put(`/posts/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(updatedPost);
  
    expect(response.statusCode).toBe(404);
  });
  
  test("Test updating a post without auth", async () => {
    const updatedPost = {
      title: "Updated title",
      content: "Updated content",
    };
    const response = await request(app).put(`/posts/${postId}`).send(updatedPost); 
    expect(response.statusCode).toBe(401);
  });
  
  test("Test delete an invalid postId with auth", async () => {
    const invalidId = "invalidId";
    const response = await request(app)
      .delete(`/posts/${invalidId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid ID format");
  });
  
  test("Test delete a post not found with auth", async () => {
    const response = await request(app)
      .delete(`/posts/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`); 
  
    expect(response.statusCode).toBe(404);
  });
  
  test("Test delete a post not found without auth", async () => {
    const response = await request(app).delete(`/posts/${postId}`);
    expect(response.statusCode).toBe(401);
  });

  



});