import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db/psql.js"; // sesuaikan path koneksi PostgreSQL kamu

export const router = express.Router();

router.post("/", async (req, res) => {
  const { nama, email, password, alamat, jenis_kelamin, tanggal_lahir, peran } =
    req.body;
  const tbname = req.query.tbname;

  try {
    // Cek apakah email sudah terdaftar
    const existingUser = await pool.query(
      `SELECT * FROM ${tbname} WHERE email = $1`,
      [email],
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    // Simpan user ke database TANPA HASH
    const result = await pool.query(
      `INSERT INTO ${tbname} (nama, email,password,alamat,jenis_kelamin,tanggal_lahir,peran) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nama, email, password, alamat, jenis_kelamin, tanggal_lahir, peran],
    );

    const user = result.rows[0];

    // Buat token JWT
    const token = jwt.sign({ id: user.id }, "RAHASIA_APOTIK", {
      expiresIn: "30d",
    });

    res.json({ user, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Gagal membuat akun" });
  }
});

export default router;
