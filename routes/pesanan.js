// routes/pesanan.js
import express from "express";
import { pool } from "../db/psql.js";
import { upload } from "../middleware/uploadBukti.js";
import { v4 as uuidv4 } from "uuid";

export const router = express.Router();

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
      "SELECT p.*, u.nama AS nama_produk FROM detail_pesanan p JOIN produk u ON p.id_produk = u.id WHERE id_pesanan = $1",
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
    const { id_user, status_pembelian, detail } = req.body;
    const buktiPath = req.file
      ? "/images/bukti_bayar/" + req.file.filename
      : null;

    const id_pesanan = uuidv4(); // Token unik pesanan

    // Insert ke table pesanan
    await pool.query(
      `INSERT INTO pesanan (id_pesanan, id_user, status_pembelian, bukti_pembayaran)
       VALUES ($1, $2, $3, $4)`,
      [id_pesanan, id_user, status_pembelian || "menunggu", buktiPath],
    );

    // Masukkan detail pesanan
    const parsedDetail = JSON.parse(detail); // Array of item {id_produk, jumlah, harga}

    for (const item of parsedDetail) {
      await pool.query(
        `INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah, harga)
         VALUES ($1, $2, $3, $4)`,
        [id_pesanan, item.id, item.jumlah, item.harga],
      );
    }
    res.status(201).json({ message: "Pesanan berhasil disimpan", id_pesanan });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Gagal menyimpan pesanan", error: err.message });
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

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM pesanan WHERE id_user = $1",
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Ubah status pesanan jadi 'selesai' dan kurangi stok
router.put("/selesai/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Update status pesanan
    await client.query(
      "UPDATE pesanan SET status_pembelian = $1 WHERE id_pesanan = $2",
      ["selesai", id],
    );

    // 2. Kurangi stok produk berdasarkan detail pesanan
    await client.query(
      `
      UPDATE produk
      SET stok = stok - dp.jumlah
      FROM detail_pesanan dp
      WHERE dp.id_produk = produk.id AND dp.id_pesanan = $1
    `,
      [id],
    );

    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Pesanan diselesaikan dan stok dikurangi" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Gagal menyelesaikan pesanan:", err);
    res.status(500).json({ error: "Gagal memproses pesanan" });
  } finally {
    client.release();
  }
});
