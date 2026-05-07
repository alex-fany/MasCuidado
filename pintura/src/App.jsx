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
  MapIcon, 
  HomeIcon, 
  CalendarIcon,
  UsersIcon,
  StarIcon
} from "./components/common/Icons"

export default function App() {
  // Estados de Autenticación
  const [page, setPage] = useState("login")
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  // Estados Globales de la App
  const [currentView, setCurrentView] = useState("home")
  const [activePetId, setActivePetId] = useState(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddMascotaOpen, setIsAddMascotaOpen] = useState(false);
  const [isNoPetsModalOpen, setIsNoPetsModalOpen] = useState(false);
  
  // Feedback (Toast)
  const [toast, setToast] = useState({ show: false, message: "" });
  
  // Datos Reales de la BD
  const [pets, setPets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);

  const showSuccessToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 5000);
  };

  const fetchReminders = useCallback(async (authToken) => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/recordatorios", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) setReminders(data);
    } catch (error) {
      console.error("Error fetching reminders in App:", error);
    }
  }, []);

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
      fetchReminders(savedToken);
    }
  }, [fetchPets, fetchReminders])

  const handleLoginSuccess = (userData) => {
    const savedToken = localStorage.getItem("token");
    setUser(userData)
    setToken(savedToken)
    setPage("dashboard")
    
    // Resetear estados de interfaz al entrar
    setIsConfigModalOpen(false);
    setIsUserModalOpen(false);
    setIsNoPetsModalOpen(false);
    setCurrentView("home");

    fetchPets(savedToken);
    fetchReminders(savedToken);
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setToken(null)
    setPets([])
    setReminders([])
    
    // Cerrar todos los modales al salir
    setIsConfigModalOpen(false);
    setIsUserModalOpen(false);
    setIsAddMascotaOpen(false);
    setIsNoPetsModalOpen(false);

    setPage("login")
    setCurrentView("home")
    setActivePetId(null)
  }

  const activePet = pets.find(p => p.id === activePetId) || pets[0] || null;

  const handleNavigate = (viewId) => {
    const restrictedViews = ['logros', 'map', 'calendar'];
    if (restrictedViews.includes(viewId) && pets.length === 0) {
      setIsNoPetsModalOpen(true);
    } else {
      setCurrentView(viewId);
    }
  };

  const navItems = [
    { id: 'logros', label: "Logros", icon: <TrophyIcon /> },
    { id: 'map', label: "Mapa", icon: <MapIcon /> },
    { id: 'home', label: "Home", icon: <HomeIcon /> },
    { id: 'calendar', label: "Calendario", icon: <CalendarIcon /> },
    { id: 'profile', label: "Perfil", icon: <UsersIcon /> },
  ];

  return (
    <main className="h-screen w-full flex items-center justify-center selection:bg-[#2d9b96]/20 overflow-hidden bg-[#2D9B96]" style={{ background: 'linear-gradient(179deg, rgba(45, 155, 150, 1) 0%, rgba(58, 171, 165, 1) 19%, rgba(95, 196, 184, 1) 38%, rgba(141, 217, 204, 1) 56%, rgba(186, 232, 220, 1) 75%, rgba(229, 245, 239, 1) 90%, rgba(255, 255, 255, 1) 100%)' }}>
      {page === "dashboard" ? (
        <div className="h-full w-full bg-transparent font-sans flex flex-col overflow-hidden relative selection:bg-[#5fc4b8]/30 no-scrollbar">
          
          <DashboardHeader 
            onConfigClick={() => setIsConfigModalOpen(true)}
            onAddMascotaClick={() => setIsAddMascotaOpen(true)}
            activePet={activePet}
            pets={pets}
            setActivePetId={setActivePetId}
          />

          {/* Área central */}
          <main className="flex-1 w-full overflow-hidden relative flex flex-col">
            {currentView === 'home' && activePet && (
              <HomeView 
                activePet={activePet} 
                reminders={reminders}
                onPetUpdated={() => fetchPets(token)} 
              />
            )}

            {currentView === 'home' && !activePet && !loadingPets && (
               <div className="flex-1 flex flex-col items-center justify-center text-white/80 p-8 text-center animate-in fade-in duration-500">
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
                activePet={activePet} 
                pets={pets}
                onRefreshRemindersGlobal={() => fetchReminders(token)}
              />
            )}

            {!['home', 'map', 'calendar'].includes(currentView) && (
              <div className="flex-1 flex flex-col items-center justify-center text-[#2d9b96] animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/10 backdrop-blur-sm rounded-[3rem] m-4">
                <div className="text-8xl mb-6 animate-bounce-gentle">✨</div>
                <h2 className="text-3xl font-black italic tracking-tight text-white">Vista de {currentView}</h2>
                <p className="text-[#bcedea] font-bold mt-2 uppercase tracking-widest text-sm">Próximamente en +Cuidado</p>
              </div>
            )}
          </main>

          {/* Navbar */}
          <div className="shrink-0 w-full">
            {!isAddMascotaOpen && (
              <BottomNav 
                navItems={navItems} 
                currentView={currentView} 
                onNavigate={handleNavigate} 
                onUserClick={() => setIsUserModalOpen(true)}
              />
            )}
          </div>

          {isNoPetsModalOpen && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-[#2d9b96]/20 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsNoPetsModalOpen(false)}></div>
              <div className="relative bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 border-white animate-in zoom-in-95 duration-500 text-center">
                <div className="w-24 h-24 bg-[#f0fdfa] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-2 border-[#bcedea]">
                  <span className="text-5xl animate-bounce-gentle">🐾</span>
                </div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight italic mb-2">¡Casi listo!</h3>
                <p className="text-gray-500 font-bold leading-relaxed mb-8">
                  Para poder acceder a esta sección, primero necesitamos conocer a tu mejor amigo. 
                  <span className="block mt-2 text-[#2d9b96]">¡Registra una mascota primero!</span>
                </p>
                <button 
                  onClick={() => setIsNoPetsModalOpen(false)}
                  className="w-full py-4 bg-[#2d9b96] text-white font-black rounded-2xl shadow-xl hover:bg-[#23807c] transition-all uppercase tracking-widest text-sm"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

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
            activePetId={activePet?.id}
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
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center justify-items-center w-full gap-8 lg:gap-12 xl:gap-14">
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

                <div className="hidden lg:flex flex-col items-start justify-center text-white space-y-6 lg:space-y-8">
                <div className="space-y-4 max-w-sm">
                    <h1 className="text-5xl xl:text-6xl font-black leading-[1.1] drop-shadow-2xl tracking-tighter text-left">
                    {page === "login" ? "Tu mascota en" : "Bienvenido a"} <br />
                    <span className="relative inline-block text-white italic">
                        +Cuidado
                        <span className="absolute -bottom-1.5 left-0 w-full h-2 bg-white/30 rounded-full"></span>
                    </span>
                    </h1>
                    <p className="text-lg xl:text-xl text-white font-semibold leading-relaxed drop-shadow-md text-left">
                    La plataforma definitiva para el seguimiento de tus mejores amigos.
                    </p>
                </div>
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
        </div>
      )}
    </main>
  )
}
