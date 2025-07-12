import express from "express";
import { pool } from "../db/psql.js";
import jwt from "jsonwebtoken";

export const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  const tbname = req.query.tbname;
  const user = await pool.query(`SELECT * FROM ${tbname} WHERE email = $1`, [
    email,
  ]);

  if (!user.rows.length)
    return res.status(404).json({ error: "User tidak ditemukan" });

  const isMatch = password === user.rows[0].password; // Gunakan bcrypt untuk real app
  if (!isMatch) return res.status(401).json({ error: "Password salah" });

  const token = jwt.sign({ id: user.rows[0].id }, "RAHASIA_APOTIK", {
    expiresIn: "30d",
  });

  res.json({
    token,
    user: user.rows[0],
  });
});
