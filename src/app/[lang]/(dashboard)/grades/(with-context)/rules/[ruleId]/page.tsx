import GradesRulesPage from "@/features/grades/rules/pages/GradesRulesPage";
export default async function Page({ params }: { params: Promise<{ ruleId: string }> }) { const { ruleId } = await params; return <GradesRulesPage mode="edit" ruleId={ruleId} />; }
