import multer from "multer";
import fs from "fs";
import path from "path";

const dir = path.resolve("public/images/produk");

// Pastikan folder ada
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `produk-${unique}${ext}`);
  },
});

const upload = multer({ storage });

export default upload;
