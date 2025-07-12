// routes/konsultasi.js
import express from "express";
import { pool } from "../db/psql.js";

export const router = express.Router();

// GET semua konsultasi (join dengan nama user dan dokter)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT k.*, u.nama AS nama_user, a.nama AS nama_dokter
       FROM konsultasi k
       JOIN users u ON k.id_user = u.id
       JOIN admin a ON k.id_dokter = a.id
       ORDER BY k.tanggal_konsultasi DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET satu konsultasi (optional)
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM konsultasi WHERE id_user = $1`,
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST tambah konsultasi
router.post("/", async (req, res) => {
  const { id_user, id_dokter, topik, catatan } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO konsultasi (id_user, id_dokter, topik, catatan)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_user, id_dokter, topik, catatan],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update status, catatan & balasan
router.put("/:id", async (req, res) => {
  const { status_konsultasi, catatan, balasan, id_dokter, topik } = req.body;

  try {
    const result = await pool.query(
      `UPDATE konsultasi 
       SET id_dokter = $1 ,status_konsultasi = $2, catatan = $3, balasan = $4, topik = $5
       WHERE id = $6 
       RETURNING *`,
      [id_dokter, status_konsultasi, catatan, balasan, topik, req.params.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// DELETE konsultasi
router.delete("/:id", async (req, res) => {
  console.log(req.params.id);
  try {
    await pool.query(`DELETE FROM konsultasi WHERE id = $1`, [req.params.id]);
    res.json({ message: "Konsultasi dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
