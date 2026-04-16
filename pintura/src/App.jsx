import { useState, useEffect } from "react"
import Card from "./components/Card"
import LoginForm from "./components/LoginForm"
import RegisterForm from "./components/RegisterForm"
import ForgotPasswordForm from "./components/ForgotPasswordForm"

// Layout y Vistas
import DashboardHeader from "./components/layout/DashboardHeader"
import BottomNav from "./components/layout/BottomNav"
import SettingsModal from "./components/layout/SettingsModal"
import HomeView from "./components/dashboard/HomeView"
import MapView from "./components/map/MapView"

// Iconos para la navegación
import { 
  TrophyIcon, 
  MapPinIcon, 
  HomeIcon, 
  CalendarIcon,
  UsersIcon
} from "./components/common/Icons"

export default function App() {
  // --- Estados de Autenticación ---
  const [page, setPage] = useState("login")
  const [user, setUser] = useState(null)

  // --- Estados Globales de la App ---
  const [currentView, setCurrentView] = useState("home")
  const [activePetId, setActivePetId] = useState(1)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  // --- Datos Mock (Simulados) ---
  const pets = [
    { id: 1, name: "Trapeador", type: "Perro", breed: "Golden", realAvatar: "🐶", virtualAvatar: "🐾" },
    { id: 2, name: "Demóstenes", type: "Gato", breed: "Siames", realAvatar: "🐱", virtualAvatar: "🐾" },
  ];

  const reminders = [
    { id: 1, petId: 1, time: "14:00", text: "Me tocan las pastillas" },
  ];

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
    setCurrentView("home") // Reset navigation
  }

  // Cálculos de datos activos
  const activePet = pets.find(p => p.id === activePetId) || pets[0];
  const activeReminder = reminders.find(r => r.petId === activePetId);
  const petReminders = reminders.filter(r => r.petId === activePetId);

  // Definición de items de navegación
  const navItems = [
    { id: 'logros', label: "Logros", icon: <TrophyIcon /> },
    { id: 'map', label: "Mapa", icon: <MapPinIcon /> },
    { id: 'home', label: "Home", icon: <HomeIcon /> },
    { id: 'calendar', label: "Calendario", icon: <CalendarIcon /> },
    { id: 'profile', label: "Perfil", icon: <UsersIcon /> },
  ];

  return (
    <main className="min-h-screen lg:h-[100dvh] w-full flex items-center justify-center selection:bg-[#2d9b96]/20 overflow-x-hidden p-4 sm:p-6">
      {page === "dashboard" ? (
        <div className="h-screen w-full bg-transparent font-sans flex flex-col overflow-hidden relative selection:bg-[#5fc4b8]/30 no-scrollbar">
          
          <DashboardHeader 
            onConfigClick={() => setIsConfigModalOpen(true)}
            activePet={activePet}
            pets={pets}
            setActivePetId={setActivePetId}
          />

          {/* ÁREA DINÁMICA DE VISTAS */}
          <main className="flex-1 w-full overflow-y-auto no-scrollbar relative">
            {currentView === 'home' && (
              <HomeView 
                activePet={activePet} 
                reminders={petReminders} 
                activeReminder={activeReminder} 
              />
            )}
            
            {currentView === 'map' && <MapView />}

            {/* Placeholder para futuras vistas */}
            {!['home', 'map'].includes(currentView) && (
              <div className="flex-1 h-full flex flex-col items-center justify-center text-[#2d9b96] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-8xl mb-6 animate-bounce-gentle">✨</div>
                <h2 className="text-3xl font-black italic tracking-tight">Vista de {currentView}</h2>
                <p className="text-[#3aaba5] font-bold mt-2">Próximamente en +Cuidado</p>
              </div>
            )}
          </main>

          <BottomNav 
            navItems={navItems} 
            currentView={currentView} 
            onNavigate={setCurrentView} 
          />

          <SettingsModal 
            isOpen={isConfigModalOpen} 
            onClose={() => setIsConfigModalOpen(false)} 
            onLogout={handleLogout} 
          />

          <style dangerouslySetInnerHTML={{ __html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes float-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .animate-float-gentle { animation: float-gentle 4s ease-in-out infinite; }
            .animate-bounce-gentle { animation: bounce-gentle 4s ease-in-out infinite; }
            .animate-spin-slow { animation: spin-slow 40s linear infinite; }
          `}} />
        </div>
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
