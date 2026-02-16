const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const auth = require("../middleware/auth");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

router.get("/", auth, async (req, res) => {
  try {
    const files = fs
      .readdirSync(uploadDir)
      .filter((name) => !name.startsWith("."))
      .map((name) => ({ name, url: `/uploads/${name}` }))
      .reverse();
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "Failed to list media" });
  }
});

router.post("/upload", auth, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  res.status(201).json({
    name: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  });
});

router.delete("/:name", auth, async (req, res) => {
  try {
    const rawName = req.params?.name || "";
    const safeName = path.basename(rawName);
    if (!safeName) {
      return res.status(400).json({ message: "File name is required" });
    }
    const filePath = path.join(uploadDir, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    fs.unlinkSync(filePath);
    return res.json({ message: "File deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete media" });
  }
});

module.exports = router;
