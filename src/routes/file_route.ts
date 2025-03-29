// FILE: routes/file_route.ts
import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); 
  },
  filename: (req, file, cb) => {
    
    const ext = path.extname(file.originalname);
  
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const filePath = req.file.path.replace(/\\/g, "/");

  const baseUrl = process.env.DOMAIN_BASE ;
  const fullUrl = `${baseUrl}/${filePath}`;

  res.json({ url: fullUrl });
});

export default router;
