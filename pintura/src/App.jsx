import { useState, useEffect, useCallback } from "react"
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
import CalendarView from "./components/calendar/CalendarView"
import UserModal from './components/layout/UserModal';
import AddMascotaModal from './components/layout/AddMascotaModal';

// Iconos para la navegación
import { 
  TrophyIcon, 
  MapPinIcon, 
  HomeIcon, 
  CalendarIcon,
  UsersIcon,
  StarIcon
} from "./components/common/Icons"

export default function App() {
  // --- Estados de Autenticación ---
  const [page, setPage] = useState("login")
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  // --- Estados Globales de la App ---
  const [currentView, setCurrentView] = useState("home")
  const [activePetId, setActivePetId] = useState(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddMascotaOpen, setIsAddMascotaOpen] = useState(false);
  
  // --- Feedback (Toast) ---
  const [toast, setToast] = useState({ show: false, message: "" });
  
  // --- Datos Reales de la BD ---
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);

  const reminders = [
    { id: 1, petId: 1, time: "14:00", text: "Me tocan las pastillas" },
  ];

  const showSuccessToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 5000);
  };

  const fetchPets = useCallback(async (authToken, isNewPet = false) => {
    if (!authToken) return;
    setLoadingPets(true);
    try {
      const res = await fetch("/api/mascotas", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El servidor no devolvió JSON.");
      }

      const data = await res.json();
      if (res.ok) {
        const emojiMap = {
          'Perro': '🐶',
          'Gato': '🐱',
          'Conejo': '🐰',
          'Tortuga': '🐢',
          'Ave': '🦜',
          'Hamster': '🐹'
        };

        setPets(data.map(p => ({
          ...p,
          realAvatar: emojiMap[p.tipo] || '🐾',
          virtualAvatar: '🐾'
        })));
        
        // Seleccionar automáticamente la primera mascota si no hay activa o si es nueva
        if (data.length > 0 && (!activePetId || isNewPet)) {
          setActivePetId(data[0].id);
        }

        if (isNewPet) showSuccessToast("Mascota registrada con éxito");

      } else {
        if (res.status === 401) handleLogout();
      }
    } catch (error) {
      console.error("Error al obtener mascotas:", error.message);
    } finally {
      setLoadingPets(false);
    }
  }, [activePetId]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    const savedToken = localStorage.getItem("token")
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setToken(savedToken)
      setPage("dashboard")
      fetchPets(savedToken);
    }
  }, [fetchPets])

  const handleLoginSuccess = (userData) => {
    const savedToken = localStorage.getItem("token");
    setUser(userData)
    setToken(savedToken)
    setPage("dashboard")
    fetchPets(savedToken);
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setToken(null)
    setPets([])
    setPage("login")
    setCurrentView("home")
    setActivePetId(null)
  }

  // Garantizar que activePet sea un objeto válido con campos reales de la BD
  const activePet = pets.find(p => p.id === activePetId) || pets[0] || null;

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
            onAddMascotaClick={() => setIsAddMascotaOpen(true)}
            activePet={activePet}
            pets={pets}
            setActivePetId={setActivePetId}
          />

          {/* ÁREA DINÁMICA DE VISTAS */}
          <main className="flex-1 w-full overflow-y-auto no-scrollbar relative">
            {currentView === 'home' && activePet && (
              <HomeView 
                activePet={activePet} 
                reminders={reminders.filter(r => r.petId === activePetId)} 
                activeReminder={reminders.find(r => r.petId === activePetId)} 
              />
            )}

            {currentView === 'home' && !activePet && !loadingPets && (
               <div className="flex-1 h-full flex flex-col items-center justify-center text-white/80 p-8 text-center animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl mb-4 border-2 border-white/30 animate-bounce-gentle">
                    🐾
                  </div>
                  <h3 className="text-2xl font-black italic">¿A quién cuidamos hoy?</h3>
                  <p className="font-bold text-[#bcedea] mt-2 max-w-[250px]">Presiona el botón de arriba para registrar a tu primer amigo.</p>
               </div>
            )}
            
            {currentView === 'map' && <MapView activePet={activePet} />}

            {currentView === 'calendar' && (
              <CalendarView 
                reminders={reminders} 
                activePet={activePet} 
              />
            )}

            {/* Placeholder para vistas vacías */}
            {!['home', 'map', 'calendar'].includes(currentView) && (
              <div className="flex-1 h-full flex flex-col items-center justify-center text-[#2d9b96] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-8xl mb-6 animate-bounce-gentle">✨</div>
                <h2 className="text-3xl font-black italic tracking-tight">Vista de {currentView}</h2>
                <p className="text-[#3aaba5] font-bold mt-2">Próximamente en +Cuidado</p>
              </div>
            )}
          </main>

          {/* OCULTAR BOTTOMNAV CUANDO EL MODAL ESTÉ ABIERTO */}
          {!isAddMascotaOpen && (
            <BottomNav 
              navItems={navItems} 
              currentView={currentView} 
              onNavigate={setCurrentView} 
              onUserClick={() => setIsUserModalOpen(true)}
            />
          )}

          {/* TOAST FEEDBACK */}
          {toast.show && (
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-[#2d9b96] text-white px-8 py-4 rounded-[2rem] shadow-2xl z-[10000] font-black text-sm border-4 border-white/30 animate-in slide-in-from-bottom-10 fade-in duration-500 flex items-center gap-3">
               <StarIcon filled />
               {toast.message}
            </div>
          )}

          <SettingsModal 
            isOpen={isConfigModalOpen} 
            onClose={() => setIsConfigModalOpen(false)} 
            onLogout={handleLogout} 
          />
          <UserModal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            onLogout={handleLogout}
          />
          
          <AddMascotaModal 
            isOpen={isAddMascotaOpen}
            onClose={() => setIsAddMascotaOpen(false)}
            onRefreshPets={(success) => fetchPets(token, success)}
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
