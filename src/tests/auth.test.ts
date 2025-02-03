import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/posts_model";
import { Express } from "express";
import userModel, { IUser } from "../models/users_model";

var app: Express;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await userModel.deleteMany();
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

const baseUrl = "/auth";

type User = IUser & {
  accessToken?: string,
  refreshToken?: string
};

const testUser: User = {
  username: "testuser",
  email: "test@user.com",
  password: "testpassword",
}

describe("Auth Tests", () => {
  test("Register new user", async () => {
    const response = await request(app).post(baseUrl + "/register").send(testUser);
    expect(response.statusCode).toBe(201);
    expect(response.body.user).toHaveProperty('_id',);
    expect(response.body.user.email).toBe(testUser.email);
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

//problem here
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
    expect(response.statusCode).not.toBe(200);

    const response2 = await request(app).post(baseUrl + "/login").send({
      email: "dsfasd",
      password: "sdfsd",
    });
    expect(response2.statusCode).not.toBe(200);

    const response3 = await request(app).post(baseUrl + "/login").send({
      email: "",
      password: "",
    });
    expect(response3.statusCode).toBe(400);
    expect(response3.body).toHaveProperty("error");
  });
//problem here
  test("Auth test me", async () => {
    const response = await request(app).post("/posts").send({
      title: "Test Post",
      content: "Test Content",
      owner: "sdfSd",
    });
    expect(response.statusCode).not.toBe(201);
    const response2 = await request(app).post("/posts").set(
      { authorization: "JWT " + testUser.accessToken }
    ).send({
      title: "Test Post",
      content: "Test Content",
      owner: "sdfSd",
    });
    expect(response2.statusCode).toBe(201);
  });
//problem here
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
//problem here
  test("Double use refresh token", async () => {
    const response = await request(app).post(baseUrl + "/refresh").send({
      refreshToken: testUser.refreshToken,
    });
    expect(response.statusCode).toBe(200);
    const refreshTokenNew = response.body.refreshToken;

    const response2 = await request(app).post(baseUrl + "/refresh").send({
      refreshToken: testUser.refreshToken,
    });
    expect(response2.statusCode).not.toBe(200);

    const response3 = await request(app).post(baseUrl + "/refresh").send({
      refreshToken: refreshTokenNew,
    });
    expect(response3.statusCode).not.toBe(200);
  });
//problem here
  test("Fail to refresh with invalid token", async () => {
    const response = await request(app).post(`${baseUrl}/refresh`).send({
      refreshToken: "invalidToken",
    });
    expect(response.statusCode).toBe(500);
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

  });

  test("Fail to refresh after logout", async () => {
    const response = await request(app).post(`${baseUrl}/refresh`).send({
      refreshToken: testUser.refreshToken,
    });
    expect(response.statusCode).toBe(500);
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

    // Restore original implementation
    jest.restoreAllMocks();
  });

  test("Logout fails with unknown error", async () => {
    jest.spyOn(userModel.prototype, "save").mockImplementationOnce(() => {
      throw "Unknown error"; // Throw a non-Error object
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
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
  });


  test("Refresh fails with unknown error", async () => {
    jest.spyOn(userModel.prototype, "save").mockImplementationOnce(() => {
      throw "Unknown error"; // Throw a non-Error object
    });

    const response = await request(app).post(`${baseUrl}/refresh`).send({refreshToken: testUser?.refreshToken});
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Refresh failed");
    expect(response.body.details).toBe("Unknown error occurred");

    // Restore original implementation
    jest.restoreAllMocks();
  });

});