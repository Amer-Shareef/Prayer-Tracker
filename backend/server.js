const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors"); // Import CORS package
const authRoutes = require("./routes/authRoutes");

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Routes
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
