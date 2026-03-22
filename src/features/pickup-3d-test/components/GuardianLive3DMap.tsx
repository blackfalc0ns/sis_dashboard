"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Chip, Stack, Typography } from "@mui/material";
import { GuardianLiveLocation, SchoolMapLocation } from "../types";

interface GuardianLive3DMapProps {
  guardianLocation: GuardianLiveLocation | null;
  schoolLocation: SchoolMapLocation;
}

type GoogleMapsRuntime = {
  maps: {
    importLibrary: (library: string) => Promise<Record<string, unknown>>;
    Marker?: new (...args: unknown[]) => {
      setPosition: (position: { lat: number; lng: number }) => void;
    };
    Map?: new (
      element: HTMLElement,
      options: Record<string, unknown>,
    ) => unknown;
    SymbolPath?: {
      CIRCLE: unknown;
    };
  };
};

type MountedMap =
  | {
      mode: "3d";
      map: {
        append: (child: unknown) => void;
      };
      guardianMarker: {
        position: { lat: number; lng: number; altitude?: number };
      };
    }
  | {
      mode: "fallback";
      guardianMarker: {
        setPosition: (position: { lat: number; lng: number }) => void;
      };
    };

declare global {
  interface Window {
    google?: GoogleMapsRuntime;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "pickup-3d-test-google-maps-script";
let googleMapsLoader: Promise<GoogleMapsRuntime> | null = null;

function loadGoogleMaps(apiKey: string): Promise<GoogleMapsRuntime> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (googleMapsLoader) {
    return googleMapsLoader;
  }

  googleMapsLoader = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps) {
          resolve(window.google);
          return;
        }

        reject(new Error("Google Maps loaded without a runtime object."));
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load the Google Maps script."));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=beta&libraries=maps,marker,maps3d`;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
        return;
      }

      reject(new Error("Google Maps loaded without a runtime object."));
    };

    script.onerror = () => {
      reject(new Error("Failed to load the Google Maps script."));
    };

    document.head.appendChild(script);
  });

  return googleMapsLoader;
}

function getMapErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to initialize the Google Maps preview.";
}

export default function GuardianLive3DMap({
  guardianLocation,
  schoolLocation,
}: GuardianLive3DMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountedMapRef = useRef<MountedMap | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"3d" | "fallback" | "unavailable">(
    "unavailable",
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const hasApiKey = apiKey.length > 0;

  const initialGuardianLocation = useMemo(() => {
    return (
      guardianLocation ?? {
        guardianId: "pending",
        guardianName: "Loading guardian",
        studentName: "Loading student",
        lat: schoolLocation.lat,
        lng: schoolLocation.lng,
        accuracy: 0,
        updatedAt: new Date().toISOString(),
      }
    );
  }, [guardianLocation, schoolLocation.lat, schoolLocation.lng]);

  useEffect(() => {
    let isCancelled = false;

    async function initializeMap() {
      if (!containerRef.current || !hasApiKey) {
        return;
      }

      try {
        const google = await loadGoogleMaps(apiKey);

        if (isCancelled || !containerRef.current) {
          return;
        }

        if (mountedMapRef.current) {
          setMapError(null);
          return;
        }

        const maps3dLibrary = await google.maps
          .importLibrary("maps3d")
          .catch(() => null);

        if (maps3dLibrary?.Map3DElement && maps3dLibrary?.Marker3DElement) {
          const Map3DElement = maps3dLibrary.Map3DElement as new (
            options: Record<string, unknown>,
          ) => HTMLElement & {
            append: (child: unknown) => void;
          };
          const Marker3DElement = maps3dLibrary.Marker3DElement as new (
            options: Record<string, unknown>,
          ) => {
            position: { lat: number; lng: number; altitude?: number };
          };

          containerRef.current.innerHTML = "";

          const map3d = new Map3DElement({
            center: {
              lat: schoolLocation.lat,
              lng: schoolLocation.lng,
              altitude: 120,
            },
            range: 900,
            tilt: 58,
            heading: 24,
            mode: "HYBRID",
          });

          const schoolMarker = new Marker3DElement({
            position: {
              lat: schoolLocation.lat,
              lng: schoolLocation.lng,
              altitude: 0,
            },
            label: schoolLocation.name,
          });

          const guardianMarker = new Marker3DElement({
            position: {
              lat: initialGuardianLocation.lat,
              lng: initialGuardianLocation.lng,
              altitude: 0,
            },
            label: initialGuardianLocation.guardianName,
          });

          map3d.append(schoolMarker);
          map3d.append(guardianMarker);
          containerRef.current.appendChild(map3d);

          mountedMapRef.current = {
            mode: "3d",
            map: map3d,
            guardianMarker,
          };
          setMapMode("3d");
          setMapError(null);
          return;
        }

        const mapsLibrary = await google.maps.importLibrary("maps");
        const markerLibrary = await google.maps.importLibrary("marker").catch(
          () => null,
        );
        const MapConstructor =
          (mapsLibrary.Map as GoogleMapsRuntime["maps"]["Map"]) ??
          google.maps.Map;
        const MarkerConstructor =
          (markerLibrary?.Marker as GoogleMapsRuntime["maps"]["Marker"]) ??
          google.maps.Marker;

        if (!MapConstructor || !MarkerConstructor || !containerRef.current) {
          throw new Error("Google Maps did not expose the expected constructors.");
        }

        containerRef.current.innerHTML = "";

        const fallbackMap = new MapConstructor(containerRef.current, {
          center: {
            lat: schoolLocation.lat,
            lng: schoolLocation.lng,
          },
          zoom: 18,
          mapTypeId: "satellite",
          tilt: 67.5,
          heading: 24,
          disableDefaultUI: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        new MarkerConstructor({
          map: fallbackMap,
          position: {
            lat: schoolLocation.lat,
            lng: schoolLocation.lng,
          },
          title: schoolLocation.name,
          label: "S",
        });

        const guardianMarker = new MarkerConstructor({
          map: fallbackMap,
          position: {
            lat: initialGuardianLocation.lat,
            lng: initialGuardianLocation.lng,
          },
          title: initialGuardianLocation.guardianName,
          label: "G",
        });

        mountedMapRef.current = {
          mode: "fallback",
          guardianMarker,
        };
        setMapMode("fallback");
        setMapError(
          "3D mode is not available for this browser or API configuration. Showing a tilted satellite fallback.",
        );
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setMapMode("unavailable");
        setMapError(getMapErrorMessage(error));
      }
    }

    initializeMap();

    return () => {
      isCancelled = true;
    };
  }, [
    apiKey,
    hasApiKey,
    initialGuardianLocation.guardianName,
    initialGuardianLocation.lat,
    initialGuardianLocation.lng,
    schoolLocation.lat,
    schoolLocation.lng,
    schoolLocation.name,
  ]);

  useEffect(() => {
    if (!guardianLocation || !mountedMapRef.current) {
      return;
    }

    if (mountedMapRef.current.mode === "3d") {
      mountedMapRef.current.guardianMarker.position = {
        lat: guardianLocation.lat,
        lng: guardianLocation.lng,
        altitude: 0,
      };
      return;
    }

    mountedMapRef.current.guardianMarker.setPosition({
      lat: guardianLocation.lat,
      lng: guardianLocation.lng,
    });
  }, [guardianLocation]);

  if (!hasApiKey) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 3 }}>
        Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your local env file
        to render the live 3D map preview. The mock guardian feed is still
        available through the test API route.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Stack spacing={0.5}>
          <Typography variant="h6" fontWeight={700}>
            Guardian Live Pickup Map
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Centered on the school with a guardian marker refreshed from the
            local mock route every 5 seconds.
          </Typography>
        </Stack>

        <Chip
          color={mapMode === "3d" ? "success" : mapMode === "fallback" ? "warning" : "default"}
          label={
            mapMode === "3d"
              ? "3D preview active"
              : mapMode === "fallback"
                ? "Tilted satellite fallback"
                : "Map unavailable"
          }
          variant={mapMode === "3d" ? "filled" : "outlined"}
        />
      </Stack>

      {mapError ? (
        <Alert severity={mapMode === "fallback" ? "info" : "error"} sx={{ borderRadius: 3 }}>
          {mapError}
        </Alert>
      ) : null}

      <Box
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          minHeight: { xs: 380, md: 560 },
          background:
            "linear-gradient(180deg, rgba(3,107,128,0.08) 0%, rgba(247,162,1,0.08) 100%)",
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "inherit",
          }}
        />
      </Box>
    </Stack>
  );
}
