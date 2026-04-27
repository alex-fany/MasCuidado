require('dotenv').config()

const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const mascotaRoutes = require('./routes/mascotaRoutes')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/mascotas', mascotaRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
  console.log(`Servidor corriendo en puerto ${PORT}`)
})