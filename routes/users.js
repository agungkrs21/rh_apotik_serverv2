import express from "express";
import { pool } from "../db/psql.js";

export const router = express.Router();

// Get semua semua users
router.get("/users", async (req, res) => {
  try {
    const adminResult = await pool.query(`
      SELECT id, nama, email, password, alamat, jenis_kelamin, tanggal_lahir, peran, 'admin' AS sumber
      FROM admin
    `);

    const userResult = await pool.query(`
      SELECT id, nama, email, password, alamat, jenis_kelamin, tanggal_lahir, peran, 'users' AS sumber
      FROM users
    `);

    const allUsers = [...adminResult.rows, ...userResult.rows];
    res.json(allUsers);
  } catch (err) {
    console.error("Error fetch users:", err);
    res.status(500).json({ error: "Gagal mengambil data users" });
  }
});

// GET semua Users
router.get("/", async (req, res) => {
  try {
    const tbname = req.query.tbname;
    const result = await pool.query(`SELECT * FROM ${tbname} ORDER BY id ASC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET User berdasarkan ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const tbname = req.query.tbname;
  try {
    const result = await pool.query(`SELECT * FROM ${tbname} WHERE id = $1`, [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST tambah Users
router.post("/", async (req, res) => {
  const { nama, email, password, alamat, jenis_kelamin, tanggal_lahir, peran } =
    req.body;
  const tbname = req.query.tbname;
  try {
    const result = await pool.query(
      `INSERT INTO ${tbname} (nama, email,password,alamat,jenis_kelamin,tanggal_lahir,peran) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nama, email, password, alamat, jenis_kelamin, tanggal_lahir, peran],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update users
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const tbname = req.query.tbname;
  const { nama, email, password, alamat, jenis_kelamin, tanggal_lahir, peran } =
    req.body;
  try {
    const result = await pool.query(
      `UPDATE ${tbname} SET nama = $1, email = $2, password = $3, alamat = $4, jenis_kelamin = $5, tanggal_lahir = $6, peran = $7 WHERE id = $8 RETURNING *`,
      [nama, email, password, alamat, jenis_kelamin, tanggal_lahir, peran, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE produk
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const tbname = req.query.tbname;
  try {
    const result = await pool.query(
      `DELETE FROM ${tbname} WHERE id = $1 RETURNING *`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
