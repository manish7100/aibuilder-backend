console.log("RUNNING FILE ");

require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const app = express();

// ==================
// ✅ CLOUDINARY CONFIG (REAL SECRET)
// ==================
cloudinary.config({
  cloud_name: "dzqzilr3f",
  api_key: "865773155558251",
  api_secret: "HY0zdAFCytB0mfP6SjfljEv8ctA"
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
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "products"
    });

    // ✅ DELETE TEMP FILE (VERY IMPORTANT)
    fs.unlinkSync(req.file.path);

    res.json({ imageUrl: result.secure_url });

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==================
// TEST ROUTE
// ==================
app.get("/check", (req, res) => {
  res.send("NEW CODE WORKING");
});

// ==================
// PRODUCT APIs
// ==================
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
  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

// ==================
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running");
});