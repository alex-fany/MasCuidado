import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { MapPinIcon, SearchIcon, StarIcon } from '../common/Icons';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useNearbyPlaces } from '../../hooks/useNearbyPlaces';

const containerStyle = { width: '100%', height: '100%' };
const LIBRARIES = ['places', 'marker']; 

const MAP_OPTIONS = {
  mapId: 'DEMO_MAP_ID', 
  disableDefaultUI: false,
  clickableIcons: false,
};

export default function MapView({ activePet }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || "", 
    libraries: LIBRARIES,
  });

  const { location, error: locationError, loading: locationLoading } = useUserLocation();
  const { places, fetchNearbyPlaces } = useNearbyPlaces();

  const [map, setMap] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [favoriteClinic, setFavoriteClinic] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPlace, setPendingPlace] = useState(null);
  const searchInputRef = useRef(null);

  const isInitialLoading = !isLoaded || locationLoading;

  useEffect(() => {
    if (activePet?.clinicasFavoritas && activePet.clinicasFavoritas.length > 0) {
      const fav = activePet.clinicasFavoritas[0];
      setFavoriteClinic({
        place_id: fav.placeId,
        name: fav.nombre,
        vicinity: fav.direccion
      });
    } else {
      const saved = localStorage.getItem('favoriteClinic');
      if (saved) {
        setFavoriteClinic(JSON.parse(saved));
      }
    }
  }, [activePet]);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setMapCenter(newPos);
        map?.panTo(newPos);
        map?.setZoom(15);
        fetchNearbyPlaces(map, newPos);
      }
    }
  };

  const handleFavoriteClick = (place) => {
    const isFav = favoriteClinic?.place_id === place.place_id;
    if (isFav) {
      setFavoriteClinic(null);
      localStorage.removeItem('favoriteClinic');
    } else {
      setPendingPlace(place);
      setShowConfirmModal(true);
    }
  };

  const saveFavorite = async (applyToAll) => {
    const place = pendingPlace;
    if (!place) return;

    const clinicData = {
      place_id: place.place_id,
      name: place.name,
      vicinity: place.vicinity,
      location: place.geometry.location,
      rating: place.rating
    };

    setFavoriteClinic(clinicData);
    localStorage.setItem('favoriteClinic', JSON.stringify(clinicData));
    
    if (activePet && activePet.id) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/mascotas/${activePet.id}/favorita`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            placeId: place.place_id,
            nombre: place.name,
            direccion: place.vicinity,
            applyToAll: applyToAll
          })
        });
      } catch (error) {
        console.error("Error saving favorite:", error);
      }
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setShowConfirmModal(false);
    setPendingPlace(null);
  };

  useEffect(() => {
    if (isLoaded && map && location && !mapCenter) {
      setMapCenter(location);
      fetchNearbyPlaces(map, location);
    }
  }, [isLoaded, map, location, fetchNearbyPlaces, mapCenter]);

  const handleRecenter = useCallback(() => {
    if (map && location) {
      map.panTo(location);
      map.setZoom(15);
      setMapCenter(location);
      fetchNearbyPlaces(map, location);

      if (searchInputRef.current) {
        searchInputRef.current.value = '';
      }
    }
  }, [map, location, fetchNearbyPlaces]);

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
        <div className="text-red-500 text-5xl">⚠️</div>
        <h3 className="text-[#2d9b96] font-black text-xl">Error de Conexión</h3>
        <p className="text-gray-500 max-w-xs font-bold text-sm leading-relaxed">
          No se pudo conectar con Google Maps. Por favor, reinicia la aplicación.
        </p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
        <div className="text-amber-500 text-5xl">🔑</div>
        <h3 className="text-amber-600 font-black text-xl">Clave no detectada</h3>
        <p className="text-gray-500 max-w-xs font-bold text-sm">
          Vite no encuentra tu VITE_GOOGLE_MAPS_API_KEY. ¿Reiniciaste el servidor?
        </p>
      </div>
    );
  }

  return (
    <section className="h-full w-full max-w-4xl mx-auto flex flex-col px-4 pt-0 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden text-left">
      <header className="mb-4 flex justify-between items-center px-2 shrink-0">
        <div className="text-left">
          <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_4px_8px_rgba(45,155,150,0.4)] tracking-tight">
            Clínicas veterinarias cercanas
          </h2>
          <p className="text-[#3aaba5] font-bold text-sm">Encuentra la mejor atención para tu mascota</p>
        </div>
      </header>

      <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-[3rem] border-4 border-dashed border-[#3aaba5]/30 flex flex-col relative shadow-inner overflow-hidden mb-6 transition-all duration-700 min-h-0">
        
        {isInitialLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-pulse h-full">
            <div className="p-8 bg-[#f0fdfa] rounded-full shadow-lg shadow-[#2d9b96]/10 animate-bounce-gentle border-2 border-white">
              <MapPinIcon />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-[#2d9b96] font-black text-2xl tracking-tight">Cargando...</h3>
            </div>
          </div>
        ) : locationError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 animate-in zoom-in duration-300 h-full">
             <div className="text-red-500 text-5xl opacity-80">📍</div>
             <h3 className="text-[#2d9b96] font-black text-xl">Ubicación necesaria</h3>
             <p className="text-gray-500 font-medium max-w-xs">{locationError}</p>
             <button onClick={() => window.location.reload()} className="mt-2 px-8 py-2.5 bg-[#2d9b96] text-white rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all">
               Intentar de nuevo
             </button>
          </div>
        ) : (
          <div className="w-full h-full relative animate-in fade-in duration-1000">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20">
              <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <SearchIcon />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar otra zona..."
                    className="w-full pl-12 pr-6 py-3 bg-white/90 backdrop-blur-md border-2 border-[#3aaba5]/30 rounded-2xl shadow-xl focus:outline-none focus:border-[#2d9b96] text-[#2d9b96] font-semibold placeholder-[#3aaba5]/50 transition-all text-sm group-hover:border-[#3aaba5]/50"
                  />
                </div>
              </Autocomplete>
            </div>

            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter || location}
              zoom={14}
              onLoad={onMapLoad}
              options={MAP_OPTIONS}
              onClick={() => setSelectedPlace(null)}
            >
              <MarkerF 
                position={location} 
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE,
                  fillColor: '#3B82F6',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3,
                  scale: 8,
                }}
              />

              {places.map((place) => (
                <MarkerF
                  key={place.place_id}
                  position={place.geometry.location}
                  onClick={() => setSelectedPlace(place)}
                  // ANIMACIÓN RESTAURADA
                  animation={window.google?.maps?.Animation?.DROP}
                  icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    fillColor: favoriteClinic?.place_id === place.place_id ? "#fbbf24" : "#2d9b96",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#ffffff",
                    scale: favoriteClinic?.place_id === place.place_id ? 1.8 : 1.5,
                    anchor: new window.google.maps.Point(12, 22),
                  }}
                />
              ))}

              {selectedPlace && (
                <InfoWindow position={selectedPlace.geometry.location} onCloseClick={() => setSelectedPlace(null)}>
                  <div className="p-1 min-w-[180px] max-w-[240px] font-sans text-left">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="font-bold text-[#2d9b96] text-sm leading-tight">{selectedPlace.name}</h4>
                      <button onClick={() => handleFavoriteClick(selectedPlace)} className="shrink-0 hover:scale-110 transition-transform active:scale-90">
                        <StarIcon filled={favoriteClinic?.place_id === selectedPlace.place_id} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug mb-2">{selectedPlace.vicinity}</p>
                    {selectedPlace.rating && (
                       <span className="text-[10px] font-bold text-yellow-600">⭐ {selectedPlace.rating}</span>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>

            <button 
              onClick={handleRecenter}
              className="absolute bottom-6 left-6 w-14 h-14 bg-[#2d9b96] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white/50 z-10 group"
            >
              <div className="group-hover:rotate-12 transition-transform duration-300">
                <MapPinIcon />
              </div>
            </button>

            {/* Modal de Confirmación de Favoritos */}
            {showConfirmModal && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a1f1e]/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-[2rem] p-8 shadow-2xl border-2 border-[#3aaba5]/20 max-w-sm w-full animate-in zoom-in-95 duration-200 text-center">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-teal-100">
                    <StarIcon filled />
                  </div>
                  <h3 className="text-[#2d9b96] font-black text-xl mb-2 italic">¿Guardar favorita?</h3>
                  <p className="text-gray-500 text-xs font-bold mb-6 leading-relaxed">
                    ¿Quieres vincular esta clínica a todas tus mascotas o solo a la actual?
                  </p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => saveFavorite(true)}
                      className="w-full py-3 bg-[#2d9b96] text-white font-black rounded-xl text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#2d9b96]/20"
                    >
                      Todas mis mascotas
                    </button>
                    <button 
                      onClick={() => saveFavorite(false)}
                      className="w-full py-3 bg-white border-2 border-teal-100 text-[#2d9b96] font-black rounded-xl text-xs uppercase tracking-widest hover:bg-teal-50 active:scale-95 transition-all"
                    >
                      Solo {activePet?.nombre || "esta mascota"}
                    </button>
                    <button 
                      onClick={() => { setShowConfirmModal(false); setPendingPlace(null); }}
                      className="mt-2 text-gray-400 font-bold text-[10px] uppercase hover:text-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showToast && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#2d9b96] text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 z-30 flex items-center gap-2 border-2 border-white/30">
                <StarIcon filled />
                ¡Clínica guardada!
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
