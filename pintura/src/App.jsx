import { useState } from "react"
import Card from "./components/Card"
import LoginForm from "./components/LoginForm"
import RegisterForm from "./components/RegisterForm"
import ForgotPasswordForm from "./components/ForgotPasswordForm"

export default function App(){

  const [page,setPage] = useState("login")

  return(
    <div className="flex items-center justify-center">

      <div className="flex flex-col lg:flex-row min-h-screen items-center max-w-7xl mx-autogap-8 py-4">

      <div className="w-full lg:w-1/2 flex justify-center lg:justify-end p-4">

      <Card className="w-full max-w-md mx-auto lg:mx-0transform lg:translate-x-12">

        {page === "login" &&
          <LoginForm
            onRegisterClick={()=>setPage("register")}
            onForgotClick={()=>setPage("forgot")}
          />
        }

        {page === "register" &&
          <RegisterForm
            onLoginClick={()=>setPage("login")}
          />
        }

        {page === "forgot" &&
          <ForgotPasswordForm
            onLoginClick={()=>setPage("login")}
          />
        }

      </Card>

    </div>

      {page === "login" && (
          <div className="w-full lg:w-1/2 text-white space-y-6 p-4 lg:p-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Bienvenid@ a<br />
              <span className="text-green-500 italic tracking-normal">+Cuidado</span>
            </h1>
            
            <p className="text-base sm:text-lg text-black/85 max-w-lg">
              Accede a tu cuenta para gestionar todos tus servicios.
            </p>

            <div className="mt-8 relative w-full max-w-lg h-48 sm:h-64 bg-white/60 rounded-2xl overflow-hidden backdrop-blur-sm border border-white/50">
              <img 
                src="https://uvn-brightspot.s3.amazonaws.com/assets/vixes/p/perro_-_gato.jpg" 
                alt="Imagen de login"
                className="w-full h-full object-cover"
              />
            </div>

          </div>
        )}

        {page === "register" && (
          <div className="w-full lg:w-1/2 text-white space-y-6 p-4 lg:p-8">
            <h1 className="
              text-3xl sm:text-4xl lg:text-5xl 
              font-bold 
              leading-tight
            ">
              Comienza tu aventura<br />
              <span className="text-green-400">con +Cuidado</span>
            </h1>
            
            <p className="text-base sm:text-lg text-black/85 max-w-lg">
              Crea una cuenta y disfruta de todos los beneficios de nuestra app.
            </p>

            <div className="mt-8 relative w-full max-w-lg h-48 sm:h-64 bg-white/10 rounded-2xl overflow-hidden backdrop-blur-sm
              border border-white/20
            ">
              <img 
                src="https://lealcan.com/wp-content/uploads/elementor/thumbs/convivencia-entre-perros-y-ninos-r0dfgcz4nahb1b2zq7rii6xlijhlckth8cbcqj2h84.jpg" 
                alt="Imagen de registro"
                className="w-full h-full object-cover"
              />
            </div>

           </div>
        )}

      </div>
    </div>
  )
}

{/*
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
        <div className="App">
        <AuthForm />
        </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
*/}