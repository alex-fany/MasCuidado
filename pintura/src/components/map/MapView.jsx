import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
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

export default function MapView() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const { location, error: locationError, loading: locationLoading } = useUserLocation();
  const { places, loading: placesLoading, fetchNearbyPlaces } = useNearbyPlaces();

  const [map, setMap] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [favoriteClinic, setFavoriteClinic] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const searchInputRef = useRef(null);

  const isInitialLoading = !isLoaded || locationLoading;

  // Cargar favorita del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favoriteClinic');
    if (saved) {
      setFavoriteClinic(JSON.parse(saved));
    }
  }, []);

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
        map.panTo(newPos);
        map.setZoom(15);
        fetchNearbyPlaces(map, newPos);
      }
    }
  };

  const toggleFavorite = (place) => {
    const isFav = favoriteClinic?.place_id === place.place_id;
    if (isFav) {
      setFavoriteClinic(null);
      localStorage.removeItem('favoriteClinic');
    } else {
      const clinicData = {
        place_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        location: place.geometry.location,
        rating: place.rating
      };
      setFavoriteClinic(clinicData);
      localStorage.setItem('favoriteClinic', JSON.stringify(clinicData));
      
      // Feedback visual
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
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

      // Limpiar el input de búsqueda
      if (searchInputRef.current) {
        searchInputRef.current.value = '';
      }
    }
  }, [map, location, fetchNearbyPlaces]);

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 font-bold p-10 text-center">
        Error al cargar la librería de Mapas.
      </div>
    );
  }

  return (
    <section className="h-full w-full max-w-4xl mx-auto flex flex-col px-4 pt-0 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <header className="mb-4 flex justify-between items-center px-2 shrink-0">
        <div>
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
              <h3 className="text-[#2d9b96] font-black text-2xl tracking-tight">Localizando...</h3>
              <p className="text-[#3aaba5] font-semibold max-w-[250px]">
                Preparando el mapa para ti.
              </p>
            </div>
          </div>
        ) : locationError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 animate-in zoom-in duration-300 h-full">
             <div className="text-red-500 text-5xl opacity-80">📍</div>
             <h3 className="text-[#2d9b96] font-black text-xl">Ubicación necesaria</h3>
             <p className="text-gray-500 font-medium max-w-xs">{locationError}</p>
             <button 
               onClick={() => window.location.reload()}
               className="mt-2 px-8 py-2.5 bg-[#2d9b96] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#2d9b96]/20 hover:scale-105 active:scale-95 transition-all"
             >
               Intentar de nuevo
             </button>
          </div>
        ) : (
          <div className="w-full h-full relative animate-in fade-in duration-1000">
            {/* Buscador de lugares */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20">
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
              >
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
              <Marker 
                position={location} 
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE,
                  fillColor: '#3B82F6',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3,
                  scale: 8,
                }}
                title="Tu ubicación"
              />

              {places.map((place) => (
                <Marker
                  key={place.place_id}
                  position={place.geometry.location}
                  onClick={() => setSelectedPlace(place)}
                  icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    fillColor: favoriteClinic?.place_id === place.place_id ? "#fbbf24" : "#2d9b96",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#ffffff",
                    scale: favoriteClinic?.place_id === place.place_id ? 1.8 : 1.5,
                    anchor: new window.google.maps.Point(12, 22),
                  }}
                  animation={window.google?.maps?.Animation?.DROP}
                />
              ))}

              {selectedPlace && (
                <InfoWindow
                  position={selectedPlace.geometry.location}
                  onCloseClick={() => setSelectedPlace(null)}
                >
                  <div className="p-1 min-w-[180px] max-w-[240px] font-sans">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="font-bold text-[#2d9b96] text-sm leading-tight">{selectedPlace.name}</h4>
                      <button 
                        onClick={() => toggleFavorite(selectedPlace)}
                        className="shrink-0 hover:scale-110 transition-transform active:scale-90"
                        title={favoriteClinic?.place_id === selectedPlace.place_id ? "Quitar de favoritos" : "Guardar como favorita"}
                      >
                        <StarIcon filled={favoriteClinic?.place_id === selectedPlace.place_id} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug mb-2">{selectedPlace.vicinity}</p>
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-100">
                      {selectedPlace.rating && (
                         <span className="text-[10px] font-bold text-yellow-600 flex items-center gap-0.5">
                           ⭐ {selectedPlace.rating}
                         </span>
                      )}
                      <span className="text-[9px] font-black text-[#2d9b96] uppercase tracking-tighter italic">
                        {favoriteClinic?.place_id === selectedPlace.place_id ? "¡Tu Favorita!" : "Clínica Cercana"}
                      </span>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>

            {/* Botón flotante de ubicación actual */}
            <button 
              onClick={handleRecenter}
              className="absolute bottom-6 left-6 w-14 h-14 bg-[#2d9b96] text-white rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white/50 z-10 group"
            >
              <div className="group-hover:rotate-12 transition-transform duration-300">
                <MapPinIcon />
              </div>
            </button>

            {/* Toast de confirmación */}
            {showToast && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#2d9b96] text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 z-30 flex items-center gap-2 border-2 border-white/30">
                <StarIcon filled />
                ¡Clínica guardada como favorita!
              </div>
            )}

            {placesLoading && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-5 py-2 rounded-full shadow-lg border border-[#3aaba5]/20 flex items-center gap-3 z-10 animate-in slide-in-from-top-4 duration-300">
                <span className="w-2 h-2 bg-[#2d9b96] rounded-full animate-ping"></span>
                <span className="text-[#2d9b96] text-[10px] font-black uppercase tracking-widest">Explorando...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
