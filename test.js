console.log("RUNNING FILE ");

require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// 🔥 NEW
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();

// ==================
// CLOUDINARY CONFIG
// ==================
cloudinary.config({
  cloud_name: "dzqzilr3f",
  api_key: "865773155558251",
  api_secret: "PASTE_NEW_SECRET_HERE"
});

// ==================
// MIDDLEWARE
// ==================
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// multer temp storage
const upload = multer({ dest: "uploads/" });

// ==================
// DATABASE
// ==================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error", err));

// ==================
// SCHEMA
// ==================
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// ==================
// 🔥 IMAGE UPLOAD API
// ==================
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "products"
    });

    res.json({ imageUrl: result.secure_url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================
// PRODUCT APIs
// ==================

app.get("/check", (req, res) => {
  res.send("NEW CODE WORKING");
});

app.post("/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ message: "Added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/products", async (req, res) => {
  const data = await Product.find().sort({ createdAt: -1 });
  res.json(data);
});

app.delete("/products/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

app.put("/products/:id", async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// ==================
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running");
});