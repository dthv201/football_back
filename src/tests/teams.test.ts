// import request from "supertest";
// import initApp from "../server";
// import mongoose from "mongoose";
// import { Express } from "express";
// import Team, { ITeam } from "../models/team_model";
// import User from "../models/users_model";
// import jwt from "jsonwebtoken";


// describe("Team API", () => {
//     let app: Express;
//     let userId: mongoose.Types.ObjectId;
//     let accessToken: string;
//     let newTeam: ITeam;

//     beforeAll(async () => {
//         console.log("beforeAll");
//         app = await initApp();
//         await Team.deleteMany();
        

//         // const user = await User.create({
//         //     username: "Test Manager",
//         //     email: "manager@test.com",
//         //     password: "123456",
//         // });

//         // userId = new mongoose.Types.ObjectId(user._id);

//         userId = new mongoose.Types.ObjectId("67c1ee109975aeb2e575fd2f");

        

//         // const payload = { _id: userId, email: "manager@test.com" };
//         // const secret = process.env.TOKEN_SECRET || "defaultSecret";
//         // accessToken = jwt.sign(payload, secret, { expiresIn: process.env.TOKEN_EXPIRES });
//         const loginResult = await request(app).post("/api/auth/login").send({
//             email: "manager@test.com",
//             password: "123456",
//           });
        
//           accessToken = loginResult.body.token;

//         newTeam = new Team({
//             name: "FC Testers",
//             manager: userId,
//             players: [userId],
//             maxPlayers: 10,
//         });
//     });

//     afterAll(async () => {
//         console.log("afterAll");

//         await mongoose.connection.close();
//     });

//     test("✅Create New Team", async () => {
//         const res = await request(app)
//             .post("/api/teams")
//             .send(newTeam);
//             // .set("Authorization", `Bearer ${accessToken}`);
//         expect(res.statusCode).toBe(201);
//         expect(res.body).toHaveProperty("_id");
//         expect(res.body.team.name).toBe(newTeam.name);
//         expect(res.body.team.manager).toBe(newTeam.manager);
//         expect(res.body.team.players).toBe(newTeam.players);
//         expect(res.body.team.maxPlayers).toBe(newTeam.maxPlayers);
//         newTeam._id = res.body._id;
//     });

//     // test("✅Get All Teams", async () => {
//     //     const res = await request(app)
//     //         .get("/api/teams")
//     //         .set("Authorization", `Bearer ${accessToken}`);
//     //     expect(res.statusCode).toBe(200);
//     //     expect(res.body.length).toBeGreaterThan(0);
//     // });

//     // test("Get Team by object id", async () => {
//     //     const res = await request(app).get(`/api/teams/${newTeam._id}`);
//     //     expect(res.statusCode).toBe(200);
//     //     expect(res.body._id).toBe(newTeam._id);
//     // });

//     // test("✅Update Team", async () => {
//     //     const updatedTeam = { name: "FC Updated" };
//     //     const res = await request(app)
//     //         .put(`/api/teams/${newTeam._id}`)
//     //         .send(updatedTeam);
//     //     expect(res.statusCode).toBe(200);
//     //     expect(res.body.name).toBe(updatedTeam.name);
//     // });

//     // test("✅ מחיקת קבוצה", async () => {
//     //     const res = await request(app).delete(`/api/teams/${teamId}`);
//     //     expect(res.statusCode).toBe(200);
//     //     const checkRes = await request(app).get(`/api/teams/${teamId}`);
//     //     expect(checkRes.statusCode).toBe(404); // הקבוצה כבר לא קיימת
//     // });
// });
