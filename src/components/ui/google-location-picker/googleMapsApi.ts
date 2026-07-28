export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

export interface GooglePlaceResult {
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
}

export type GoogleMapsStatus = "OK" | "ZERO_RESULTS" | string;

export interface GoogleMapInstance {
  setCenter: (position: GoogleLatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  addListener: (
    eventName: "click",
    callback: (event: GoogleMapMouseEvent) => void,
  ) => void;
}

export interface GoogleMapMouseEvent {
  latLng?: { lat: () => number; lng: () => number };
}

export interface GoogleMarkerInstance {
  setPosition: (position: GoogleLatLngLiteral) => void;
  addListener: (
    eventName: "dragend",
    callback: (event: GoogleMapMouseEvent) => void,
  ) => void;
}

export interface GoogleCircleInstance {
  setCenter: (position: GoogleLatLngLiteral) => void;
  setRadius: (radius: number) => void;
  setMap: (map: GoogleMapInstance | null) => void;
}

export interface GoogleAutocompleteService {
  getPlacePredictions: (
    request: { input: string; language?: string },
    callback: (
      predictions: GooglePlacePrediction[] | null,
      status: GoogleMapsStatus,
    ) => void,
  ) => void;
}

export interface GooglePlace {
  displayName?: string | null;
  formattedAddress?: string | null;
  location?: {
    lat: () => number;
    lng: () => number;
  };
  fetchFields: (options: {
    fields: Array<"displayName" | "formattedAddress" | "location">;
  }) => Promise<void>;
}

export interface GooglePlaceConstructor {
  new (options: { id: string }): GooglePlace;
}

export interface GoogleGeocoder {
  geocode: (
    request: { location: GoogleLatLngLiteral; language?: string },
    callback: (
      results: GooglePlaceResult[] | null,
      status: GoogleMapsStatus,
    ) => void,
  ) => void;
}

export interface GoogleMapsApi {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: GoogleLatLngLiteral;
        zoom: number;
        mapTypeControl?: boolean;
        fullscreenControl?: boolean;
        streetViewControl?: boolean;
      },
    ) => GoogleMapInstance;
    Marker: new (options: {
      map: GoogleMapInstance;
      position: GoogleLatLngLiteral;
      draggable: boolean;
    }) => GoogleMarkerInstance;
    Circle: new (options: {
      map: GoogleMapInstance;
      center: GoogleLatLngLiteral;
      radius: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }) => GoogleCircleInstance;
    places: {
      AutocompleteService: new () => GoogleAutocompleteService;
      Place: GooglePlaceConstructor;
    };
    Geocoder: new () => GoogleGeocoder;
  };
}

declare global {
  interface Window {
    __moazezGoogleMapsPromise?: Promise<GoogleMapsApi>;
    google?: unknown;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js-api";

function getGoogleMapsApi() {
  return window.google as GoogleMapsApi | undefined;
}

export function loadGoogleMapsApi(apiKey: string, language: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("maps_unavailable"));
  }

  const loadedApi = getGoogleMapsApi();
  if (loadedApi?.maps?.places) return Promise.resolve(loadedApi);
  if (window.__moazezGoogleMapsPromise) {
    return window.__moazezGoogleMapsPromise;
  }

  window.__moazezGoogleMapsPromise = new Promise<GoogleMapsApi>(
    (resolve, reject) => {
      const resolveLoadedApi = () => {
        const api = getGoogleMapsApi();
        if (api?.maps?.places) resolve(api);
        else reject(new Error("maps_load_failed"));
      };
      const rejectLoad = () => reject(new Error("maps_load_failed"));
      const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

      if (existingScript) {
        existingScript.addEventListener("load", resolveLoadedApi, {
          once: true,
        });
        existingScript.addEventListener("error", rejectLoad, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = GOOGLE_MAPS_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=${encodeURIComponent(language)}`;
      script.addEventListener("load", resolveLoadedApi, { once: true });
      script.addEventListener("error", rejectLoad, { once: true });
      document.head.appendChild(script);
    },
  );

  return window.__moazezGoogleMapsPromise;
}
