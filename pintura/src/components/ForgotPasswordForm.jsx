import { useState } from "react"
import Input from "./Input"
import Button from "./Button"

export default function ForgotPasswordForm({onLoginClick}) {

  const [email,setEmail] = useState("")

  const handleSubmit = (e)=>{
    e.preventDefault()
    console.log("recuperar contraseña",email)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      <h2 className="text-xl font-bold text-center">
        Recuperar contraseña
      </h2>

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <Button type="submit">
        Enviar recuperación
      </Button>

      <button
        type="button"
        className="text-blue-600 text-sm"
        onClick={onLoginClick}
      >
        Volver al login
      </button>

    </form>
  )
}