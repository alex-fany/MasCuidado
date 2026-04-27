require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const mascotaRoutes = require('./src/routes/mascotaRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (Imágenes de mascotas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mascotas', mascotaRoutes);

app.get("/", (req, res) => {
  res.json({ mensaje: "Servidor MasCuidado funcionando" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
