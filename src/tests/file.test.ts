import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import path from "path";
import fs from "fs";

let app: Express;
const storagePath = path.join(__dirname, "../storage/"); // Path to storage directory
const testFilePath = path.join(__dirname, "test_file.txt"); // Test file

beforeAll(async () => {
    app = await initApp();

    // Ensure the storage directory exists
    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
    }

    // Create a sample file for testing
    fs.writeFileSync(testFilePath, "This is a test file.");
});

afterAll(async () => {
    // Clean up: Remove the uploaded test file after testing
    const uploadedFiles = fs.readdirSync(storagePath);
    uploadedFiles.forEach(file => {
        if (file.includes("test_file")) {
            fs.unlinkSync(path.join(storagePath, file));
        }
    });

    // Remove the local test file
    if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
    }

    await mongoose.connection.close();
});

describe("File Upload Tests", () => {
    test("Should upload a file and verify it is saved", async () => {
        // 🔹 Step 1: Upload file
        const response = await request(app)
            .post("/file")
            .attach("file", testFilePath);

        expect(response.statusCode).toEqual(200);

        const fileUrl = response.body.url;
        console.log("Uploaded file URL:", fileUrl);

        // Extract filename from URL
        const filename = path.basename(fileUrl);
        const savedFilePath = path.join(storagePath, filename);

        // 🔹 Step 2: Check if file exists in the storage folder
        expect(fs.existsSync(savedFilePath)).toBe(true);
        console.log("File successfully saved in:", savedFilePath);

        // 🔹 Step 3: Test GET request to fetch the file
        const fileResponse = await request(app).get(`/storage/${filename}`);
        expect(fileResponse.statusCode).toEqual(200);
        expect(fileResponse.text).toEqual("This is a test file.");
    });
});
