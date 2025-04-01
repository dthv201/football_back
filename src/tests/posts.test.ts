import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/posts_model";
import { Express } from "express";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

let app: Express;
let accessToken: string;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  process.env.DB_CONNECTION = uri;
  process.env.NODE_ENV = "test";


  app = await initApp();
  console.log("beforeAll");

  await postModel.deleteMany();

  const payload = { _id: "testUserId", email: "test@example.com" };
  const secret = process.env.TOKEN_SECRET || "defaultSecret";
  accessToken = jwt.sign(payload, secret, { expiresIn: process.env.TOKEN_EXPIRES });
});

afterAll(async () => {
  console.log("afterAll");
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();

});

var postId = "";
const testPost = {
  title: "Test title",
  content: "Test content",
  owner: "Lior",
  date: new Date().toISOString(), 
  location: "Test location" 
};
const invalidPost = {
  title: "Test title",
  content: "Test content",
};

describe("Posts test suite", () => {
  
  test("1. Fail to get all posts without token", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(401); 
  });

  test("2. Get all posts with valid token", async () => {
    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  test("3. Add new post with valid token", async () => {
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

  //--------participants--------------------------------------------------

  test("add participants to post without userId", async () => {
    const response = await request(app)
      .post("/posts/add-participant")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ postId: postId });
    expect(response.statusCode).toBe(400);
  });

  test("add participants to post but post not found", async () => {
    const response = await request(app)
      .post("/posts/add-participant")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ postId: "67e7d2009f96429b5c93689d", userId: "gaya" });
    expect(response.statusCode).toBe(404);
  });

  test("add participants to post but post not found", async () => {
    const response = await request(app)
      .post("/posts/add-participant")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ postId: postId, userId: "gaya" });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Participant added successfully");
    expect(response.body.post.participantsIds).toContain("gaya");
    
  });

  test("add participants to post but already added", async () => {
    const response = await request(app)
      .post("/posts/add-participant")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ postId: postId, userId: "gaya" });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Participant already added");
  });
  //----------remove participants--------------------------------------------------

  test("remove participants from post without userId", async () => {
    const response = await request(app)
      .post("/posts/remove-participant")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ postId: postId });
    expect(response.statusCode).toBe(400);
  });

  test("remove participants from post but post not found", async () => {
    const response = await request(app)
      .post("/posts/remove-participant")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ postId: "67e7d2009f96429b5c93689d", userId: "gaya" });
    expect(response.statusCode).toBe(404);
  });

  test("remove partiveipant from post secess", async () => {
    const response = await request(app)
      .post("/posts/remove-participant")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ postId: postId, userId: "gaya" });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Participant removed successfully");
    expect(response.body.post.participantsIds).not.toContain("gaya");
  });

  test("remove participant but participant not found", async () => {
    const response = await request(app)
      .post("/posts/remove-participant")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ postId: postId, userId: "gaya" });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Participant not found in the group");
  });

//----------------------spliting teams-------------------------------------------------------------------------
 
  test("split participants into teams without postId", async () => {
    const response = await request(app)
      .post("/posts/split-teams")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});
    expect(response.statusCode).toBe(400);
  });

  test("split participants into teams but post not found", async () => {
    const response = await request(app)
      .post("/posts/split-teams")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ postId: "67e7d2009f96429b5c93689d" });
    expect(response.statusCode).toBe(404);
  });



//-----------hendle likes------------------------------------------------------------------------------------
test("Test unliking a post with auth", async () => {
  
  const likeResponse1 = await request(app)
    .post("/posts/like")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ postId: postId, userId: "gaya" });
  expect(likeResponse1.statusCode).toBe(200);
  expect(likeResponse1.body.likesUsersIds).toContain("gaya");
  expect(likeResponse1.body.likes_number).toBeGreaterThan(0);

  // Now, call the same endpoint with the same user to unlike the post
  const likeResponse2 = await request(app)
    .post("/posts/like")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ postId: postId, userId: "gaya" });
  expect(likeResponse2.statusCode).toBe(200);
  // This should remove the user "gaya" from the likesUsersIds array
  expect(likeResponse2.body.likesUsersIds).not.toContain("gaya");
  // And update the likes_number accordingly (e.g., 0 if that was the only like)
  expect(likeResponse2.body.likes_number).toBe(0);
});
    
    
test("Test like a post with auth", async () => {
      const response = await request(app)
        .post(`/posts/like`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ postId: postId, userId: "gaya" });
      expect(response.statusCode).toBe(200);
   
    });

    test("Test like a post without auth", async () => {
      const response = await request(app).post(`/posts/like`).send({ postId: postId, userId: "gaya" });
      expect(response.statusCode).toBe(401);
    });

    test("Test like a post but post not found", async () => {
      const response = await request(app)
        .post(`/posts/like`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ postId: "67e7d2009f96429b5c93689d", userId: "gaya" });
      expect(response.statusCode).toBe(404);
    });
    

 //--------------------------------------more base tests----------------------------------------------------------- 

  test("Test updating a post with auth", async () => {
    const updatedPost = {
      title: "Updated title",
      content: "Updated content",
    };
  
    const response = await request(app)
      .put(`/posts/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`) 
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