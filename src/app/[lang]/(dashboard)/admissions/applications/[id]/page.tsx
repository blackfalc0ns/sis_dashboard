import { mockApplications } from "@/data/mockAdmissions";
import { redirect } from "next/navigation";

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const { lang: locale } = await params;
  const { id } = await params;
  const application = mockApplications.find((app) => app.id === id);

  if (!application) return null;

  return redirect(`/${locale}/admissions/applications/${id}/details`);
}
