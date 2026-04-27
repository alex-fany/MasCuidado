import { useState, useCallback } from 'react';

export const useNearbyPlaces = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNearbyPlaces = useCallback(async (map, location) => {
    const google = window.google;
    if (!google || !location) return;

    setLoading(true);
    setError(null);

    try {
      const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");
      
      const center = new google.maps.LatLng(location.lat, location.lng);
      
      const request = {
        fields: ["displayName", "location", "formattedAddress", "rating", "id"],
        locationRestriction: {
          center: center,
          radius: 8000,
        },
        includedPrimaryTypes: ["veterinary_care", "pet_store"],
        maxResultCount: 20,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
      };

      const { places: results } = await Place.searchNearby(request);

      if (results && results.length > 0) {
        const formattedPlaces = results.map(p => ({
          place_id: p.id,
          name: p.displayName,
          vicinity: p.formattedAddress,
          rating: p.rating,
          geometry: { 
            location: {
              lat: typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat,
              lng: typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng
            } 
          }
        }));
        setPlaces(formattedPlaces);
      } else {
        setPlaces([]);
        setError('No se encontraron veterinarias cercanas.');
      }
    } catch (err) {
      setError('Error al buscar veterinarias.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { places, loading, error, fetchNearbyPlaces };
};
