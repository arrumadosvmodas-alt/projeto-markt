import { useCallback, useState } from "react";

interface GeolocationState {
  loading: boolean;
  error: string | null;
  coords: { lat: number; lng: number } | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    coords: null,
  });

  const request = useCallback(() => {
    setState({ loading: true, error: null, coords: null });

    if (!("geolocation" in navigator)) {
      setState({
        loading: false,
        error: "Geolocalização não é suportada neste navegador",
        coords: null,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        setState({
          loading: false,
          error:
            error.code === error.PERMISSION_DENIED
              ? "Permissão de localização negada"
              : "Não foi possível obter sua localização",
          coords: null,
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return { ...state, request };
}
