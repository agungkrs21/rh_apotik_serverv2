import express from "express";
import { pool } from "../db/psql.js";
import upload from "../middleware/upload.js";
import fs from "fs";
import path from "path";

export const router = express.Router();

// GET semua produk
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produk ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST tambah produk
router.post("/", upload.single("gambar"), async (req, res) => {
  const { nama, kategori, deskripsi, harga, stok } = req.body;
  const gambar = req.file ? `/images/produk/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO produk (nama, kategori, deskripsi, harga, stok, gambar)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nama, kategori, deskripsi, harga, stok, gambar],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT edit produk
router.put("/:id", upload.single("gambar"), async (req, res) => {
  const id = req.params.id;
  const { nama, kategori, deskripsi, harga, stok } = req.body;

  try {
    const oldData = await pool.query("SELECT * FROM produk WHERE id = $1", [
      id,
    ]);
    if (oldData.rows.length === 0)
      return res.status(404).json({ error: "Produk tidak ditemukan" });

    let gambar = oldData.rows[0].gambar;

    // Jika upload gambar baru
    if (req.file) {
      if (gambar && fs.existsSync(path.resolve(`.${gambar}`))) {
        fs.unlinkSync(path.resolve(`.${gambar}`)); // hapus gambar lama
      }
      gambar = `/images/produk/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE produk SET nama = $1, kategori = $2, deskripsi = $3, harga = $4, stok = $5, gambar = $6 WHERE id = $7 RETURNING *`,
      [nama, kategori, deskripsi, harga, stok, gambar, id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE produk
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM produk WHERE id = $1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Produk tidak ditemukan" });

    const gambar = result.rows[0].gambar;
    if (gambar && fs.existsSync(path.resolve(`.${gambar}`))) {
      fs.unlinkSync(path.resolve(`.${gambar}`)); // hapus gambar file
    }

    await db.query("DELETE FROM produk WHERE id = $1", [id]);
    res.json({ message: "Produk berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
