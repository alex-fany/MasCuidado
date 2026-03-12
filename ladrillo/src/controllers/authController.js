const prisma = require('../config/prisma')

exports.register = async (req, res) => {
  try {

    const { name, email, password } = req.body

    if(!name || !email || !password){
      return res.status(400).json({
        error: "Todos los campos son obligatorios"
      })
    }

    const userExist = await prisma.usuario.findUnique({
      where:{
        correo: email
      }
    })

    if(userExist){
      return res.status(400).json({
        error: "El correo ya está registrado"
      })
    }

    const user = await prisma.usuario.create({
      data:{
        nombre_completo: name,
        correo: email,
        password: password
      }
    })

    res.status(201).json({
      message: "Usuario creado",
      user
    })

  } catch(error){

    res.status(500).json({
      error: "Error del servidor"
    })

  }
}