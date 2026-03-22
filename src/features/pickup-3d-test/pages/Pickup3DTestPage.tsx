"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import GuardianLive3DMap from "../components/GuardianLive3DMap";
import { PICKUP_TEST_SCHOOL } from "../mockGuardianLocation";
import { GuardianLiveLocation } from "../types";

const GUARDIAN_LOCATION_API_PATH = "/api/pickup-3d-test/guardian-location";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Waiting for updates";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid timestamp";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default function Pickup3DTestPage() {
  const [guardianLocation, setGuardianLocation] =
    useState<GuardianLiveLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGuardianLocation = useCallback(async () => {
    try {
      const response = await fetch(GUARDIAN_LOCATION_API_PATH, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Location request failed with status ${response.status}.`);
      }

      const data = (await response.json()) as GuardianLiveLocation;
      setGuardianLocation(data);
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to fetch guardian live location.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGuardianLocation();

    const intervalId = window.setInterval(() => {
      void fetchGuardianLocation();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchGuardianLocation]);

  const infoCards = useMemo(() => {
    return [
      {
        label: "Guardian name",
        value: guardianLocation?.guardianName ?? "Loading...",
      },
      {
        label: "Student name",
        value: guardianLocation?.studentName ?? "Loading...",
      },
      {
        label: "Accuracy",
        value: guardianLocation ? `+/- ${guardianLocation.accuracy} m` : "Loading...",
      },
      {
        label: "Last updated",
        value: formatTimestamp(guardianLocation?.updatedAt ?? null),
      },
    ];
  }, [guardianLocation]);

  return (
    <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Pickup 3D Test
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Isolated preview page for guardian live pickup tracking using
                mock data and a local API route.
              </Typography>
            </Box>

            <Chip
              color="primary"
              label="Prototype / removable"
              variant="outlined"
            />
          </Stack>

          <Alert severity="info" sx={{ borderRadius: 3 }}>
            This page uses a local mock guardian feed. It does not connect to
            production APIs or the mobile app.
          </Alert>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {infoCards.map((card) => (
            <Card key={card.label} elevation={0}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {card.label}
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {isLoading && !guardianLocation ? (
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading mock guardian location preview...
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        {errorMessage ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {errorMessage}
          </Alert>
        ) : null}

        <Card elevation={0}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <GuardianLive3DMap
              guardianLocation={guardianLocation}
              schoolLocation={PICKUP_TEST_SCHOOL}
            />
          </CardContent>
        </Card>
      </Stack>
    </main>
  );
}


