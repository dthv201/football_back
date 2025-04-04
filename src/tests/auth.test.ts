import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import userModel, { IUser, SkillLevel } from "../models/users_model";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Express } from "express";
import { afterAll, beforeAll, describe, expect, it, jest, test } from "@jest/globals";

dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env_test" : ".env" });

let app: Express;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await userModel.deleteMany();

  // Clean up test uploads folder
  const uploadDir = path.resolve(__dirname, "../uploads/test");
  if (fs.existsSync(uploadDir)) {
    fs.readdirSync(uploadDir).forEach((file) => {
      if (file.startsWith("1740")) { 
        const filePath = path.join(uploadDir, file);
        fs.unlinkSync(filePath);
      }
    });
    console.log("Old test images deleted.");
  }
});

afterAll(async () => {
  console.log("🧹 Cleaning up test uploads...");
  const testUploadDir = path.resolve(__dirname, "../uploads/test");
  if (fs.existsSync(testUploadDir)) {
    fs.readdirSync(testUploadDir).forEach((file) => {
      const filePath = path.join(testUploadDir, file);
      fs.unlinkSync(filePath);
    });
    console.log("All test images deleted.");
  } else {
    console.log("⚠️ No uploaded test images found.");
  }
  await mongoose.connection.close();
});

const baseUrl = "/auth";

type User = IUser & {
  accessToken?: string;
  refreshToken?: string;
  _id?: string;
};

const testUser: User = {
  username: "test_no_img",
  email: "test_no_img@example.com",
  password: "password123",
  skillLevel: SkillLevel.BEGINNER,
};

describe("Auth Tests", () => {
  test("Register user without profile image (should use default image)", async () => {
    const response = await request(app)
      .post(baseUrl + "/register")
      .send({
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        skillLevel: testUser.skillLevel,
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.user).toHaveProperty("_id");
    expect(response.body.user.profile_img).toBe(
      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
    );
    testUser._id = response.body.user._id;
  });

  test("Login user to get access token", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send({ email: testUser.email, password: testUser.password });
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    testUser.accessToken = response.body.accessToken;
  });

  // ---- fetchUser tests ----

  test("should return 401 if no token is provided", async () => {
    const res = await request(app)
      .get(baseUrl + "/user")
      .send();
    expect(res.statusCode).toBe(401);
  });


  test("should return 200 and the authenticated user if a valid token is provided", async () => {
    const res = await request(app)
      .get(baseUrl + "/user")
      .set("Authorization", `Bearer ${testUser.accessToken}`)
      .send({userId : testUser._id});
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(testUser._id);
    expect(res.body).not.toHaveProperty("password");
  });






  test(" Register user with profile image", async () => {
    const response = await request(app)
        .post(baseUrl + "/register")
        .field("username", "testuser_img")
        .field("email", "testuser_img@example.com")
        .field("password", "TestPass123")
        .field("skillLevel", "Beginner")
        .attach("profile_img", path.resolve(__dirname, "sample-avatar.png"));

    expect(response.statusCode).toBe(201);
    expect(response.body.user).toHaveProperty("_id");
    expect(response.body.user.profile_img).toBeDefined(); 
});



  test("Register user with same username", async () => {
    const response = await request(app).post(baseUrl + "/register").send({
      username: "testuser_img",
      email: "test2@user.com",
      password: "testpassword2",
      skillLevel: SkillLevel.BEGINNER,
      profile_img: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("Register user with same email", async () => {
    const response = await request(app).post(baseUrl + "/register").send({
      username: "testuser2",
      email: "testuser_img@example.com",
      password: "testpassword2",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
  });


  test("Fail to register with missing fields", async () => {
    const response = await request(app).post(`${baseUrl}/register`).send({
      email: "missing@fields.com",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("Auth test register fail", async () => {
    const response = await request(app).post(baseUrl + "/register").send({
      email: "sdsdfsd",
    });
    expect(response.statusCode).not.toBe(200);
    const response2 = await request(app).post(baseUrl + "/register").send({
      email: "",
      password: "sdfsd",
    });
    expect(response2.statusCode).not.toBe(200);
  });

  test("Registration error catch branch", async () => {
    // Temporarily mock userModel.create to throw an error
    const originalCreate = userModel.create;
    userModel.create = jest.fn(() => { throw new Error("Mock error during registration"); });
  
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "newUser", email: "new@test.com", password: "pass123" });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Registration failed/);
  
    // Restore the original function
    userModel.create = originalCreate;
  });


  test("Auth test login", async () => {
    const response = await request(app).post(baseUrl + "/login").send({
      email: testUser.email,
      password: testUser.password
    });
    expect(response.statusCode).toBe(200);
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(response.body.user._id).toBeDefined();
    testUser.accessToken = accessToken;
    testUser.refreshToken = refreshToken;
    testUser._id = response.body._id;
  });

  test("Check tokens are not the same", async () => {
    const response = await request(app).post(baseUrl + "/login").send(testUser);
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;

    expect(accessToken).not.toBe(testUser.accessToken);
    expect(refreshToken).not.toBe(testUser.refreshToken);
  });

  test("Fail to login with invalid credentials", async () => {
    const response = await request(app).post(`${baseUrl}/login`).send({
      email: testUser.email,
      password: "wrongpassword",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("Auth test login fail", async () => {
    const response = await request(app).post(baseUrl + "/login").send({
      email: testUser.email,
      password: "sdfsd",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid credentials");
  
    const response2 = await request(app).post(baseUrl + "/login").send({
      email: "dsfasd",
      password: "sdfsd",
    });
    expect(response2.statusCode).toBe(400);
    expect(response2.body).toHaveProperty("error", "Invalid credentials");
  
  });

  test(" Login fails with missing email or password", async () => {
    const response1 = await request(app).post(baseUrl + "/login").send({
        password: "testpassword",
    });
    expect(response1.statusCode).toBe(400);
    expect(response1.body).toHaveProperty("error", "Email and password are required");

    const response2 = await request(app).post(baseUrl + "/login").send({
        email: "test@user.com",
    });
    expect(response2.statusCode).toBe(400);
    expect(response2.body).toHaveProperty("error", "Email and password are required");

});

  

  test("Test refresh token", async () => {
    const response = await request(app).post(baseUrl + "/refresh").send({
      refreshToken: testUser.refreshToken,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
  });

  test(" Double use refresh token", async () => {
    const response1 = await request(app)
        .post(baseUrl + "/refresh")
        .send({ refreshToken: testUser.refreshToken });
    expect(response1.statusCode).toBe(200);
    const newToken = response1.body.refreshToken;
    
    const response2 = await request(app)
        .post(baseUrl + "/refresh")
        .send({ refreshToken: newToken });
    expect(response2.statusCode).toBe(200);

    
    const response3 = await request(app)
        .post(baseUrl + "/refresh")
        .send({ refreshToken: newToken });
    expect(response3.statusCode).toBe(403);

},10000);



  test(" Fail to refresh with invalid token", async () => {
    const response = await request(app).post(`${baseUrl}/refresh`).send({
      refreshToken: "invalidToken",
    });
    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("error");
  });

  test("Test logout", async () => {
    const response = await request(app).post(baseUrl + "/login").send(testUser);
    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;

    const response2 = await request(app).post(baseUrl + "/logout").send({
      refreshToken: testUser.refreshToken,
    });
    expect(response2.statusCode).toBe(200);

    const response3 = await request(app).post(baseUrl + "/refresh").send({
      refreshToken: testUser.refreshToken,
    });
    expect(response3.statusCode).not.toBe(200);

  },7000);

  test("Fail to refresh after logout", async () => {
    const response = await request(app).post(`${baseUrl}/refresh`).send({
      refreshToken: testUser.refreshToken,
    });
    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("error");
  });


  test("Logout fails with missing refresh token", async () => {
    const response = await request(app).post(`${baseUrl}/logout`).send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Refresh token is required");
  });

  test("Logout fails with invalid refresh token", async () => {
    const response = await request(app).post(`${baseUrl}/logout`).send({ refreshToken: "invalidToken" });
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
  });

  test("Logout fails with server error", async () => {
    jest.spyOn(userModel.prototype, "save").mockImplementationOnce(() => {
      throw new Error("Database save error");
    });

    const response = await request(app).post(`${baseUrl}/logout`).send("");
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");

    jest.restoreAllMocks();
  });

  test("Logout fails with unknown error", async () => {
    jest.spyOn(userModel.prototype, "save").mockImplementationOnce(() => {
      throw "Unknown error"; 
    });

    const response = await request(app).post(`${baseUrl}/logout`).send("");
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
    jest.restoreAllMocks();
  });

  test("Refresh fails with missing refresh token", async () => {
    const response = await request(app).post(`${baseUrl}/refresh`).send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Refresh token is required");
  });

  test("Refresh fails with invalid refresh token", async () => {
    const response = await request(app).post(`${baseUrl}/refresh`).send({ refreshToken: "invalidToken" });
    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("error");
  });


  describe('Auth Routes', () => {
    // Clean up DB before tests
    beforeAll(async () => {
      await userModel.deleteMany({});
    });
  
    afterAll(async () => {
      await userModel.deleteMany({});
      // Optionally, close DB connection
    });
  
    describe('POST /auth/register', () => {
      it('should return 400 if required fields are missing', async () => {
        const res = await request(app)
          .post('/auth/register')
          .send({ email: 'test@test.com', password: '123456' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Username, email, and password are required/);
      });
  
      it('should register a new user and return tokens (auto login)', async () => {
        const res = await request(app)
          .post('/auth/register')
          // Use multipart/form-data if file upload is expected:
          .field('username', 'testuser')
          .field('email', 'testuser@example.com')
          .field('password', '123456')
          .field('skillLevel', 'Beginner');
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user).toHaveProperty('_id');
      });
  
      it('should not allow duplicate email registration', async () => {
        // First, create a user.
        await request(app)
          .post('/auth/register')
          .field('username', 'duplicateUser')
          .field('email', 'dup@example.com')
          .field('password', '123456')
          .field('skillLevel', 'Beginner');
        // Then try to register with the same email.
        const res = await request(app)
          .post('/auth/register')
          .field('username', 'anotherUser')
          .field('email', 'dup@example.com')
          .field('password', 'abcdef')
          .field('skillLevel', 'Beginner');
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Email already exists/);
      });
    });
  
    describe('POST /auth/login', () => {
      beforeAll(async () => {
        // Ensure a user exists to test login
        await request(app)
          .post('/auth/register')
          .field('username', 'loginUser')
          .field('email', 'login@example.com')
          .field('password', '123456')
          .field('skillLevel', 'Beginner');
      });
  
      it('should login successfully with valid credentials', async () => {
        const res = await request(app)
          .post('/auth/login')
          .send({ email: 'login@example.com', password: '123456' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user.email).toBe('login@example.com');
      });
  
      it('should return 400 for invalid credentials', async () => {
        const res = await request(app)
          .post('/auth/login')
          .send({ email: 'login@example.com', password: 'wrongpassword' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid credentials/);
      });
    });

    describe('Protected Route', () => {
      it('should return 401 and "Access Denied" when POSTing without a token', async () => {
        const res = await request(app)
          .post('/posts') // Change this to the actual protected route path
          .send({ content: "Test post" });
          
        expect(res.status).toBe(401);
        expect(res.text).toBe("Access Denied");
      });
    });
    
    //Extra tests
    describe('POST /auth/refresh', () => {
      let refreshToken: string;
  
      beforeAll(async () => {
        // Register and login to get a valid refresh token.
        const res = await request(app)
          .post('/auth/register')
          .field('username', 'refreshUser')
          .field('email', 'refresh@example.com')
          .field('password', '123456')
          .field('skillLevel', 'Beginner');
        refreshToken = res.body.refreshToken;
      });
  
      it('should refresh token with valid refresh token', async () => {
        const res = await request(app)
          .post('/auth/refresh')
          .send({ refreshToken });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
      });
  
      it('should return 403 for invalid refresh token', async () => {
        const res = await request(app)
          .post('/auth/refresh')
          .send({ refreshToken: 'invalidtoken' });
        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Invalid refresh token/);
      });
    });
  
    describe('POST /auth/logout', () => {
      let refreshToken: string;
  
      beforeAll(async () => {
        // Register and login to get a valid refresh token.
        const res = await request(app)
          .post('/auth/register')
          .field('username', 'logoutUser')
          .field('email', 'logout@example.com')
          .field('password', '123456')
          .field('skillLevel', 'Beginner');
        refreshToken = res.body.refreshToken;
      });
  
      it('should return 400 if no refresh token is provided', async () => {
        const res = await request(app)
          .post('/auth/logout')
          .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Refresh token is required/);
      });
  
      it('should logout successfully with valid refresh token', async () => {
        const res = await request(app)
          .post('/auth/logout')
          .send({ refreshToken });
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/Logged out successfully/);
      });
    });
  });
});

// updateUserInfo.test.ts
jest.setTimeout(30000);
describe('PUT /auth/users/:id - Partial Update User Info', () => {
  let userId: string;
  let accessToken: string;
  let initialProfileImg: string;

  beforeAll(async () => {
    console.log('Deleting all existing users...');
    await userModel.deleteMany();

    const uniqueEmail = `test_${Date.now()}@example.com`;
    console.log(`Registering test user with email: ${uniqueEmail}`);
    const registerResponse = await request(app)
      .post('/auth/register')
      .field('username', 'testuser')
      .field('email', uniqueEmail)
      .field('password', 'password123')
      .field('skillLevel', 'Beginner');

    // Expect registration success
    expect(registerResponse.status).toBe(201);
    const registerBody = registerResponse.body;
    
    // Save user id and token from the registration response
    userId = registerBody.user._id;
    accessToken = registerBody.accessToken;
    initialProfileImg = registerBody.user.profile_img; 

    console.log(`User registered. userId: ${userId}`);
    console.log(`Initial profile_img: ${initialProfileImg}`);
    console.log(`Access Token: ${accessToken}`);
  });

  afterAll(async () => {
    console.log('Cleaning up users and closing DB connection...');
    await userModel.deleteMany({});
    await mongoose.connection.close();
  });

  it('should update username and skillLevel without changing profile_img when no file is provided', async () => {
    console.log('Starting update without file...');
    const res = await request(app)
      .put(`/auth/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('username', 'updateduserwithoutfile')
      .field('skillLevel', 'Advanced');

    console.log('Response for update without file:', res.body);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(userId);
    expect(res.body.username).toBe('updateduserwithoutfile');
    expect(res.body.skillLevel).toBe('Advanced');
    // The profile_img should remain unchanged if no new file was sent
    expect(res.body.profile_img).toBe(initialProfileImg);
  });

  it('should update profile_img if a file is provided', async () => {
    console.log('Starting update with file upload...');
    const res = await request(app)
      .put(`/auth/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      // We are not sending new text fields so they should remain unchanged
      .attach('profile_img', path.join(__dirname, 'change-sample.png')); // Ensure this file exists

    console.log('Response for update with file:', res.body);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(userId);
    // Text fields should remain as they were in the previous update
    expect(res.body.username).toBe('updateduserwithoutfile');
    expect(res.body.skillLevel).toBe('Advanced');
    // The profile_img should now reflect the uploaded file (typically containing 'uploads' in its path)
    expect(res.body.profile_img).toMatch(/uploads/);
  });

  it(' Fetch user profile', async () => {
    const res = await request(app)
      .get(`/auth/user`)
      .set('Authorization', `Bearer ${accessToken}`)
      console.log('Response for fetch user profile:', res.body);
      expect(res.status).toBe(200);
      
  
});
});


  





