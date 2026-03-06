import { useState } from "react"
import Input from "./Input"
import Button from "./Button"
import GoogleButton from "./GoogleButton"

export default function LoginForm({onRegisterClick, onForgotClick}) {

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const handleSubmit = (e) =>{
    e.preventDefault()
    console.log(email,password)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      <h2 className="text-2xl font-bold text-center">Iniciar sesión</h2>

      <Input
        label="Email"
        type="email"
        placeholder="correo@email.com"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="********"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />

      <Button type="submit">
        <a>
        Ingresar
        </a>
      </Button>

      <GoogleButton
        onClick={()=>console.log("Login Google")}
      />

      <div className="flex justify-between text-sm">

        <button
          type="button"
          className="text-blue-600"
          onClick={onForgotClick}
        >
          ¿Olvidaste tu contraseña?
        </button>

        <button
          type="button"
          className="text-blue-600"
          onClick={onRegisterClick}
        >
          Registrarse
        </button>

      </div>

    </form>
  )
}