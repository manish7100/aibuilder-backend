console.log("RUNNING FILE V3");

require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const app = express();

// ==================
// CLOUDINARY
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
// ROUTES
// ==================
app.get("/", (req, res) => res.send("API ROOT WORKING V3"));
app.get("/check", (req, res) => res.send("CHECK ROUTE V3"));

// ==================
// SCHEMA
// stock is stored as { "S": 10, "M": 5, "L": 0, "28": 3, ... }
// ==================
const productSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  image:    { type: String, required: true },
  category: { type: String, enum: ["shirt", "pant", "other"], default: "other" },
  stock:    { type: mongoose.Schema.Types.Mixed, default: {} },
  details:  { type: String, default: "" }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// helper: serialize product to plain object
function toPlain(product) {
  const obj = product.toObject();
  obj.stock = obj.stock && typeof obj.stock === "object" ? obj.stock : {};
  return obj;
}

// ==================
// IMAGE UPLOAD
// ==================
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const result = await cloudinary.uploader.upload(req.file.path, { folder: "products" });
    fs.unlinkSync(req.file.path);
    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==================
// PRODUCT CRUD
// ==================
app.post("/products", async (req, res) => {
  try {
    const { name, price, image, category, stock, details } = req.body;
    const product = new Product({
      name, price, image,
      category: category || "other",
      stock: stock || {},
      details: details || ""
    });
    await product.save();
    res.json({ message: "Added", product: toPlain(product) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/products", async (req, res) => {
  try {
    const data = await Product.find().sort({ createdAt: -1 });
    res.json(data.map(toPlain));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    const { name, price, image, category, stock, details } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.name     = name;
    product.price    = price;
    product.image    = image;
    product.category = category || "other";
    product.stock    = stock || {};
    product.details  = details || "";
    product.markModified("stock"); // required for Mixed type
    await product.save();

    res.json(toPlain(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running on port", process.env.PORT || 3000);
});
