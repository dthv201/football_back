import express from "express";
const router = express.Router();
import multer from "multer";

const base = process.env.DOMAIN_BASE + "/";

export const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.')
            .filter(Boolean) 
            .slice(1)
            .join('.')
        cb(null, Date.now() + "." + ext)
    }
})
const upload = multer({ storage: storage });

router.post('/', upload.single("file"), function (req, res) {
    // Replace backslashes with forward slashes for proper URL format.
    const filePath = req.file?.path.replace(/\\/g, "/");
    console.log("router.post(/file: " + process.env.DOMAIN_BASE + "/" + filePath);
    res.status(200).send({ url: process.env.DOMAIN_BASE + "/" + filePath });
});
export default router;