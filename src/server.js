import express from "express";
import cors from "cors";
import path from "path";
import { router as produkRoutes } from "../routes/produk.js";
import { router as userRoutes } from "../routes/users.js";
import { router as authLogin } from "../routes/login.js";
import { router as authSignUp } from "../routes/signup.js";
import { router as pesananRoutes } from "../routes/pesanan.js";
import { router as konsultasiRouter } from "../routes/konsultasi.js";
const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Server is up and running");
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve gambar statis
app.use("/images/produk", express.static(path.resolve("public/images/produk")));
app.use(
  "/images/bukti_bayar",
  express.static(path.resolve("public/images/bukti_bayar")),
);
app.use("/uploads", express.static("uploads"));

// routes API
app.use("/api/produk", produkRoutes);
app.use("/api/users", userRoutes);
app.use("/api/login", authLogin);
app.use("/api/signup", authSignUp);
app.use("/api/pesanan", pesananRoutes);
app.use("/api/konsultasi", konsultasiRouter);

app.listen(PORT, () => console.log(`Server Berjalan pada port ${PORT}`));
