console.log("RUNNING FILE ");

// FORCE dotenv path (fixes your issue)
require("dotenv").config({ path: __dirname + "/.env" });

// DEBUG (remove later)
console.log("ENV VALUE:", process.env.MONGO_URI);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ==================
// MIDDLEWARE
// ==================
app.use(cors());
app.use(express.json());

// ==================
// DATABASE CONNECTION
// ==================
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ MongoDB Connected");
})
.catch((err) => {
  console.error("❌ MongoDB Connection Failed:");
  console.error(err);
});

// ==================
// SCHEMAS & MODELS
// ==================
const websiteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }
}, { timestamps: true });

const Website = mongoose.model("Website", websiteSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// ==================
// ROUTES
// ==================
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// TEMP ROUTE (to force insert data)
app.get("/add-test", async (req, res) => {
  try {
    const product = new Product({
      name: "Phone",
      price: 15000,
      image: "test.jpg"
    });

    await product.save();

    res.send("Test product added");
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

// WEBSITE APIs
app.post("/add", async (req, res) => {
  try {
    const { title, description, image } = req.body;

    const newData = new Website({ title, description, image });
    await newData.save();

    res.json({ message: "Website data saved" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/data", async (req, res) => {
  try {
    const data = await Website.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PRODUCT APIs
app.post("/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.json({ message: "Product added" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================
// START SERVER
// ==================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});