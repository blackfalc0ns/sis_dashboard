import GradesRulesPage from "@/features/grades/rules/pages/GradesRulesPage";

interface GradeRulePageProps {
  params: Promise<{ ruleId: string }>;
}

export default async function GradeRulePage({ params }: GradeRulePageProps) {
  const { ruleId } = await params;
  return <GradesRulesPage mode="edit" ruleId={ruleId} />;
}
