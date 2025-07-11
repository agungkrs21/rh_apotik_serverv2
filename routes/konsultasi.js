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
    const result = await pool.query(`SELECT * FROM konsultasi WHERE id = $1`, [
      req.params.id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST tambah konsultasi
router.post("/", async (req, res) => {
  const {
    id_user,
    id_dokter,
    tanggal_konsultasi,
    topik,
    status_konsultasi,
    catatan,
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO konsultasi (id_user, id_dokter, tanggal_konsultasi, topik, status_konsultasi, catatan)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        id_user,
        id_dokter,
        tanggal_konsultasi,
        topik,
        status_konsultasi,
        catatan,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update status & catatan konsultasi
router.put("/:id", async (req, res) => {
  const { status_konsultasi, catatan } = req.body;
  try {
    const result = await pool.query(
      `UPDATE konsultasi SET status_konsultasi = $1, catatan = $2 WHERE id = $3 RETURNING *`,
      [status_konsultasi, catatan, req.params.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE konsultasi
router.delete("/:id", async (req, res) => {
  try {
    await db.query(`DELETE FROM konsultasi WHERE id = $1`, [req.params.id]);
    res.json({ message: "Konsultasi dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
