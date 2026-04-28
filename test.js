console.log("RUNNING FILE V2");

require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const app = express();

// ==================
// ✅ CLOUDINARY (USE ENV, NOT HARD CODE)
// ==================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// ==================
// MIDDLEWARE
// ==================
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const upload = multer({ dest: "uploads/" });

// ==================
// DATABASE
// ==================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error", err));

// ==================
// ROOT ROUTE (IMPORTANT FIX)
// ==================
app.get("/", (req, res) => {
  res.send("API ROOT WORKING");
});

// ==================
// TEST ROUTE (CHECK DEPLOY)
// ==================
app.get("/check", (req, res) => {
  res.send("CHECK ROUTE V2");
});

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
// IMAGE UPLOAD
// ==================
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "products"
    });

    fs.unlinkSync(req.file.path);

    res.json({ imageUrl: result.secure_url });

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
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