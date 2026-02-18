"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { getWithdrawalById } from "@/services/transfersWithdrawalsService";
import WithdrawalRequestDetailsPage from "@/components/students-guardians/transfers-withdrawals/details/WithdrawalRequestDetailsPage";

export default function WithdrawalDetailsRoute() {
  const params = useParams();
  const requestId = params.requestId as string;

  const withdrawal = useMemo(() => getWithdrawalById(requestId), [requestId]);

  if (!withdrawal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Withdrawal request not found</p>
        </div>
      </div>
    );
  }

  return <WithdrawalRequestDetailsPage withdrawal={withdrawal} />;
}
