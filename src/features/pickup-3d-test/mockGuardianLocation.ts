import { GuardianLiveLocation, SchoolMapLocation } from "./types";

export const PICKUP_TEST_SCHOOL: SchoolMapLocation = {
  name: "Moazzez International School",
  lat: 30.03058,
  lng: 31.49162,
};

const GUARDIAN_ROUTE_CENTER = {
  lat: PICKUP_TEST_SCHOOL.lat + 0.00115,
  lng: PICKUP_TEST_SCHOOL.lng - 0.00125,
};

export function getGuardianLiveLocationSnapshot(
  now: Date = new Date(),
): GuardianLiveLocation {
  const timeSlice = Math.floor(now.getTime() / 5000);
  const angle = ((timeSlice % 72) / 72) * Math.PI * 2;

  const lat =
    GUARDIAN_ROUTE_CENTER.lat +
    Math.sin(angle) * 0.00018 +
    Math.sin(angle * 0.35) * 0.00003;
  const lng =
    GUARDIAN_ROUTE_CENTER.lng +
    Math.cos(angle) * 0.0002 +
    Math.cos(angle * 0.4) * 0.00002;

  return {
    guardianId: "guardian-live-test-001",
    guardianName: "Mariam Hassan",
    studentName: "Youssef Hassan",
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    accuracy: Number((4 + (timeSlice % 5) * 1.4).toFixed(1)),
    updatedAt: now.toISOString(),
  };
}
