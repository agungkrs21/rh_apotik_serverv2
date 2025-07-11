// routes/pesanan.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { pool } from "../db/psql.js";

export const router = express.Router();

// Ensure upload folder exists
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// GET all pesanan
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nama FROM pesanan p
      JOIN users u ON p.id_user = u.id
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET detail pesanan berdasarkan id_pesanan
router.get("/detail_pesanan/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM detail_pesanan WHERE id_pesanan = $1",
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST tambah pesanan
router.post("/", upload.single("bukti_bayar"), async (req, res) => {
  try {
    const { id_pesanan, id_user, tanggal_pembelian, status_pembelian, detail } =
      req.body;

    const buktiPath = req.file ? `/uploads/${req.file.filename}` : null;

    await pool.query(
      `INSERT INTO pesanan (id_pesanan, id_user, tanggal_pembelian, status_pembelian, bukti_bayar)
       VALUES ($1, $2, $3, $4, $5)`,
      [id_pesanan, id_user, tanggal_pembelian, status_pembelian, buktiPath],
    );

    const detailArray = JSON.parse(detail);
    for (const item of detailArray) {
      await pool.query(
        `INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah, harga, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [id_pesanan, item.id_produk, item.jumlah, item.harga, item.total],
      );
    }

    res.status(201).json({ message: "Pesanan berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update status pesanan
router.put("/:id", async (req, res) => {
  try {
    const { status_pembelian } = req.body;
    await pool.query("UPDATE pesanan SET status_pembelian = $1 WHERE id = $2", [
      status_pembelian,
      req.params.id,
    ]);
    res.json({ message: "Status berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE pesanan
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query(
      "SELECT id_pesanan FROM pesanan WHERE id = $1",
      [id],
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "Pesanan tidak ditemukan" });

    const id_pesanan = result.rows[0].id_pesanan;

    await pool.query("DELETE FROM detail_pesanan WHERE id_pesanan = $1", [
      id_pesanan,
    ]);
    await pool.query("DELETE FROM pesanan WHERE id = $1", [id]);

    res.json({ message: "Pesanan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
