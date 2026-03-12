import { useState } from "react"
import Input from "./Input"
import Button from "./Button"

export default function RegisterForm({onLoginClick}) {

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  {/*const handleSubmit = (e)=>{
    e.preventDefault()
    console.log(name,email,password)
  }*/}
  const handleSubmit = async (e)=>{
  e.preventDefault()

  const res = await fetch("http://localhost:3000/api/auth/register",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      name,
      email,
      password
    })
  })

  const data = await res.json()

  console.log(data)
}

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      <h2 className="text-2xl font-bold text-center">Crear cuenta</h2>

      <Input
        label="Nombre"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />
      <Input
        label="Confirmar contraseña"
        type="password"
        //value={password}
        //onChange={(e)=>setPassword(e.target.value)}
      />

      <Button type="submit">
        <a>
          Registrarse
          </a>
      </Button>

      <button
        type="button"
        className="text-blue-600 text-sm"
        onClick={onLoginClick}
      >
        ¿Ya tienes cuenta? Inicia Sesión
      </button>

    </form>
  )
}