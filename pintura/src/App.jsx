import { useState, useEffect } from "react"
import Card from "./components/Card"
import LoginForm from "./components/LoginForm"
import RegisterForm from "./components/RegisterForm"
import ForgotPasswordForm from "./components/ForgotPasswordForm"
import Dashboard from "./components/Dashboard"

export default function App() {
  const [page, setPage] = useState("login")
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
      setPage("dashboard")
    }
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setPage("dashboard")
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setPage("login")
  }

  return (
    <main className="min-h-screen lg:h-[100dvh] w-full flex items-center justify-center selection:bg-[#2d9b96]/20 overflow-x-hidden p-4 sm:p-6">
      {page === "dashboard" ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        /* Contenedor Maestro */
        <div className="w-full max-w-5xl h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center justify-items-center w-full gap-8 lg:gap-12 xl:gap-14">
            
            {/* Formulario */}
            <div className="w-full flex justify-center lg:justify-end">
              <Card className="w-full max-w-[360px] shadow-[0_30px_70px_-15px_rgba(30,120,115,0.4)] bg-white/95 backdrop-blur-md border border-white/50">
                <div className="p-1">
                  {page === "login" && (
                    <LoginForm
                      onRegisterClick={() => setPage("register")}
                      onForgotClick={() => setPage("forgot")}
                      onLoginSuccess={handleLoginSuccess}
                    />
                  )}

                  {page === "register" && (
                    <RegisterForm
                      onLoginClick={() => setPage("login")}
                    />
                  )}

                  {page === "forgot" && (
                    <ForgotPasswordForm
                      onLoginClick={() => setPage("login")}
                    />
                  )}
                </div>
              </Card>
            </div>

            {/* Información */}
            <div className="hidden lg:flex flex-col items-start justify-center text-white space-y-6 lg:space-y-8">
              <div className="space-y-4 max-w-sm">
                <h1 className="text-5xl xl:text-6xl font-black leading-[1.1] drop-shadow-2xl tracking-tighter">
                  {page === "login" ? "Tu mascota en" : "Bienvenido a"} <br />
                  <span className="relative inline-block text-white italic">
                    +Cuidado
                    <span className="absolute -bottom-1.5 left-0 w-full h-2 bg-white/30 rounded-full"></span>
                  </span>
                </h1>
                
                <p className="text-lg xl:text-xl text-white font-semibold leading-relaxed drop-shadow-md">
                  La plataforma definitiva para el seguimiento de tus mejores amigos.
                </p>
              </div>

              {/* Imagen Compacta */}
              <div className="relative group w-full max-w-sm aspect-video xl:aspect-[16/10] rounded-[2rem] overflow-hidden border-[6px] border-white/10 shadow-2xl backdrop-blur-md transition-all duration-700 hover:scale-[1.02] hover:border-white/20">
                <img 
                  src={page === "login" 
                    ? "https://uvn-brightspot.s3.amazonaws.com/assets/vixes/p/perro_-_gato.jpg" 
                    : "https://lealcan.com/wp-content/uploads/elementor/thumbs/convivencia-entre-perros-y-ninos-r0dfgcz4nahb1b2zq7rii6xlijhlckth8cbcqj2h84.jpg"} 
                  alt="Mascotas"
                  className="w-full h-full object-cover opacity-95 transition-all duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  )
}
