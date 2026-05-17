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
import ProfileView from './components/layout/ProfileView';
import AchievementsView from './components/layout/AchievementsView';
import AddMascotaModal from './components/layout/AddMascotaModal';
import PetManagementModal from './components/layout/PetManagementModal';

// Iconos para la navegación
import { 
  TrophyIcon, 
  MapIcon, 
  HomeIcon, 
  CalendarIcon,
  UsersIcon,
  StarIcon
} from "./components/common/Icons"
import { useSettings } from "./context/SettingsContext"

export default function App() {
  const { t } = useSettings();
  const [page, setPage] = useState("login")
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  const [currentView, setCurrentView] = useState("home")
  const [activePetId, setActivePetId] = useState(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isAddMascotaOpen, setIsAddMascotaOpen] = useState(false);
  const [isEditPetOpen, setIsEditPetOpen] = useState(false);
  const [petToEdit, setPetToEdit] = useState(null);
  
  const [toast, setToast] = useState({ show: false, message: "", isWarning: false });
  const [pets, setPets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);

  const showToast = (message, isWarning = false) => {
    setToast({ show: true, message, isWarning });
    setTimeout(() => setToast({ show: false, message: "", isWarning: false }), 5000);
  };

  const fetchReminders = useCallback(async (authToken, toastType = null) => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/recordatorios", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReminders(data);
        if (toastType === 'registered') showToast(t('toast_rem_registered'));
        if (toastType === 'updated') showToast(t('toast_rem_updated'));
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  }, [t]);

  const fetchPets = useCallback(async (authToken, toastType = null) => {
    if (!authToken) return;
    setLoadingPets(true);
    try {
      const res = await fetch("/api/mascotas", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        const emojiMap = { 'Perro': '🐶', 'Gato': '🐱', 'Conejo': '🐰', 'Tortuga': '🐢', 'Ave': '🦜', 'Hamster': '🐹' };
        const mapped = data.map(p => ({
          ...p,
          realAvatar: emojiMap[p.tipo] || '🐾',
          virtualAvatar: '🐾'
        }));
        setPets(mapped);
        
        if (mapped.length > 0 && (!activePetId || toastType === 'registered')) {
           setActivePetId(mapped[0].id);
        }
        
        if (toastType === 'registered') showToast(t('toast_pet_registered'));
        if (toastType === 'updated') showToast(t('toast_pet_updated'));

      }
    } catch (error) {
      console.error("Error al obtener mascotas:", error);
    } finally {
      setLoadingPets(false);
    }
  }, [activePetId, t]);

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
    setUser(userData); setToken(savedToken); setPage("dashboard");
    setIsConfigModalOpen(false); setCurrentView("home");
    fetchPets(savedToken); fetchReminders(savedToken);
  }

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setUser(null); setToken(null); setPets([]); setReminders([]);
    setIsConfigModalOpen(false); setIsAddMascotaOpen(false);
    setPage("login"); setCurrentView("home"); setActivePetId(null);
  }

  const handleEditPetGlobal = (pet) => {
    setPetToEdit(pet);
    setIsEditPetOpen(true);
  };

  const handleNavigate = (viewId) => {
    if ((viewId === 'map' || viewId === 'calendar') && pets.length === 0) {
      showToast(t('toast_no_pets_access'), true);
      return;
    }
    setCurrentView(viewId);
  }

  const activePet = pets.find(p => p.id === activePetId) || pets[0] || null;

  const navItems = [
    { id: 'logros', label: t('nav_logros'), icon: <TrophyIcon /> },
    { id: 'map', label: t('nav_map'), icon: <MapIcon /> },
    { id: 'home', label: t('nav_home'), icon: <HomeIcon /> },
    { id: 'calendar', label: t('nav_calendar'), icon: <CalendarIcon /> },
    { id: 'profile', label: t('nav_profile'), icon: <UsersIcon /> },
  ];

  return (
    <main className="h-screen w-full flex items-center justify-center selection:bg-[var(--brand-primary)]/20 overflow-hidden" style={{ background: 'var(--brand-bg-gradient)' }}>
      {page === "dashboard" ? (
        <div className="h-full w-full bg-transparent font-sans flex flex-col overflow-hidden relative selection:bg-[var(--brand-accent)]/30 no-scrollbar">
          
          <DashboardHeader 
            onConfigClick={() => setIsConfigModalOpen(true)}
            onAddMascotaClick={() => setIsAddMascotaOpen(true)}
            onEditPetClick={handleEditPetGlobal}
            activePet={activePet}
            pets={pets}
            setActivePetId={setActivePetId}
          />

          <main className="flex-1 w-full overflow-hidden relative flex flex-col">
            {currentView === 'home' && (
              <HomeView activePet={activePet} reminders={reminders} onPetUpdated={() => fetchPets(token, 'updated')} />
            )}
            
            {currentView === 'map' && <MapView activePet={activePet} />}
            {currentView === 'calendar' && <CalendarView activePet={activePet} pets={pets} onRefreshRemindersGlobal={(type) => fetchReminders(token, type)} />}
            {currentView === 'profile' && <ProfileView onLogout={handleLogout} onEditPet={handleEditPetGlobal} pets={pets} />}
            {currentView === 'logros' && <AchievementsView user={user} pets={pets} reminders={reminders} />}
          </main>

          <div className="shrink-0 w-full">
            {!isAddMascotaOpen && <BottomNav navItems={navItems} currentView={currentView} onNavigate={handleNavigate} />}
          </div>

          <SettingsModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} onLogout={handleLogout} />
          
          <AddMascotaModal 
            isOpen={isAddMascotaOpen} 
            onClose={() => setIsAddMascotaOpen(false)} 
            onRefreshPets={(success) => fetchPets(token, success ? 'registered' : null)} 
            activePetId={activePet?.id} 
          />

          {isEditPetOpen && (
            <PetManagementModal 
              isOpen={isEditPetOpen}
              onClose={() => setIsEditPetOpen(false)}
              pet={petToEdit}
              onRefreshPets={(success) => fetchPets(token, success ? 'updated' : null)}
            />
          )}

          {toast.show && (
            <div className="fixed top-24 left-0 right-0 flex justify-center z-[10000] pointer-events-none px-4">
              <div className={`pointer-events-auto ${toast.isWarning ? 'bg-[var(--brand-danger)] border-[var(--brand-danger-muted)]/20 animate-shake-toast' : 'bg-[var(--brand-primary)] border-[var(--brand-border-strong)] animate-in slide-in-from-top-10 fade-in duration-500'} text-[var(--brand-button-text)] px-8 py-4 rounded-[2rem] shadow-2xl font-black text-sm border-4 flex items-center gap-3 text-center whitespace-nowrap`}>
                {toast.isWarning ? '⚠️' : <StarIcon filled />} {toast.message}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
                <div className="grid grid-cols-1 lg:grid-cols-2 items-center justify-items-center w-full gap-8 lg:gap-12 xl:gap-14">
                    <div className="w-full flex justify-center lg:justify-end">
                        <Card className="w-full max-w-[450px] shadow-2xl backdrop-blur-xl border border-[var(--brand-border-strong)]">
                            <div className="p-1">
                                {page === "login" && <LoginForm onRegisterClick={() => setPage("register")} onForgotClick={() => setPage("forgot")} onLoginSuccess={handleLoginSuccess} />}
                                {page === "register" && <RegisterForm onLoginClick={() => setPage("login")} />}
                                {page === "forgot" && <ForgotPasswordForm onLoginClick={() => setPage("login")} />}
                            </div>
                        </Card>
                    </div>

                    <div className="hidden lg:flex flex-col items-start justify-center text-white space-y-6 lg:space-y-8">
                        <div className="space-y-4 max-w-sm">
                            <h1 className="text-5xl xl:text-6xl font-black leading-[1.1] drop-shadow-2xl tracking-tighter text-left">
                                {page === "login" ? t('landing_login_title') : t('landing_register_title')} <br />
                                <span className="relative inline-block text-white italic">
                                    +Cuidado
                                    <span className="absolute -bottom-1.5 left-0 w-full h-2 bg-white/30 rounded-full"></span>
                                </span>
                            </h1>
                            <p className="text-lg xl:text-xl text-white font-semibold leading-relaxed drop-shadow-md text-left">
                                {t('landing_subtitle')}
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
