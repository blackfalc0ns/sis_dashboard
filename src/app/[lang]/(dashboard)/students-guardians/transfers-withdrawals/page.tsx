// FILE: src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/page.tsx

import { redirect } from "next/navigation";

export default function TransfersWithdrawalsPage({
  params,
}: {
  params: { lang: string };
}) {
  // Redirect to transfers tab by default
  redirect(
    `/${params.lang}/students-guardians/transfers-withdrawals/transfers`,
  );
}
