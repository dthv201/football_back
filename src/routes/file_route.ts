// FILE: routes/file_route.ts
import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // or "uploads/"
  },
  filename: (req, file, cb) => {
    // preserve extension
    const ext = path.extname(file.originalname);
    // unique name: timestamp + extension
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  // On Windows, replace backslashes with forward slashes
  const filePath = req.file.path.replace(/\\/g, "/");

  const baseUrl = process.env.DOMAIN_BASE || "http://localhost:3000";
  const fullUrl = `${baseUrl}/${filePath}`;

  console.log("File uploaded:", fullUrl);
  res.json({ url: fullUrl });
});

export default router;
