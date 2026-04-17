require('dotenv').config();
const express = require("express");
const cors = require("cors");
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.get("/", (req, res) => {
  res.json({ mensaje: "Servidor MasCuidado funcionando" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
