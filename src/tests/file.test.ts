import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import path from "path";
import fs from "fs";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

let app: Express;
const storagePath = path.join(__dirname, "../../uploads/");
const testFilePath = path.join(__dirname, "test_file.txt"); 

beforeAll(async () => {
    app = await initApp();

   
    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
    }


    fs.writeFileSync(testFilePath, "This is a test file.");
});

afterAll(async () => {
 
    const uploadedFiles = fs.readdirSync(storagePath);
    uploadedFiles.forEach(file => {
        if (file.includes("test_file")) {
            fs.unlinkSync(path.join(storagePath, file));
        }
    });

    if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
    }

    await mongoose.connection.close();
});

describe("File Upload Tests", () => {
    test("Should upload a file and verify it is saved", async () => {

        const response = await request(app)
            .post("/file")
            .attach("file", testFilePath);

        expect(response.statusCode).toEqual(200);

        const fileUrl = response.body.url;
        console.log("Uploaded file URL:", fileUrl);


        const filename = path.basename(fileUrl);
        const savedFilePath = path.join(storagePath, filename);

   
        expect(fs.existsSync(savedFilePath)).toBe(true);
        console.log("File successfully saved in:", savedFilePath);

        const fileResponse = await request(app).get(`/uploads/${filename}`);
        expect(fileResponse.statusCode).toEqual(200);
        expect(fileResponse.text).toEqual("This is a test file.");
    });
});
