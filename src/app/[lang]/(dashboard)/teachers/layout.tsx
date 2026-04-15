import AcademicsContextLayout from "@/features/academics/components/layout/AcademicsContextLayout";

export default function TeachersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AcademicsContextLayout
      contextOptions={{
        yearParamKey: "yearId",
        termParamKey: "termId",
        termStatusParamKey: "termStatus",
      }}
    >
      {children}
    </AcademicsContextLayout>
  );
}
