import AcademicsContextLayout from "@/features/academics/components/layout/AcademicsContextLayout";

export default function TeachersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AcademicsContextLayout>{children}</AcademicsContextLayout>;
}
