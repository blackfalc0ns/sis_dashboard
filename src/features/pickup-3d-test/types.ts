export interface GuardianLiveLocation {
  guardianId: string;
  guardianName: string;
  studentName: string;
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: string;
}

export interface SchoolMapLocation {
  name: string;
  lat: number;
  lng: number;
}
