require('dotenv').config()

const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const mascotaRoutes = require('./routes/mascotaRoutes')
const recordatorioRoutes = require('./routes/recordatorioRoutes')
const googleCalendarRoutes = require('./routes/googleCalendarRoutes')
const nutricionRoutes = require('./routes/nutricionRoutes')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/mascotas', mascotaRoutes)
app.use('/api/recordatorios', recordatorioRoutes)
app.use('/api/google-calendar', googleCalendarRoutes)
app.use('/api/nutricion', nutricionRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
  console.log(`Servidor corriendo en puerto ${PORT}`)
})