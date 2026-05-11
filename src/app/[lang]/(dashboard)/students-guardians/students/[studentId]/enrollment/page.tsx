import StudentTabLoader from "@/features/students-guardians/students/components/StudentTabLoader";

export default async function StudentEnrollmentHistoryPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentTabLoader studentId={studentId} tab="enrollment" />;
}
