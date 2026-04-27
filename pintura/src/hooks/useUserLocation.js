import { useState, useEffect } from 'react';

export const useUserLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('La geolocalización no es compatible con tu navegador');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Error al obtener la ubicación';
        if (err.code === 1) errorMessage = 'Permiso de ubicación denegado';
        if (err.code === 2) errorMessage = 'Ubicación no disponible';
        if (err.code === 3) errorMessage = 'Tiempo de espera agotado';
        
        setError(errorMessage);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  return { location, error, loading };
};
