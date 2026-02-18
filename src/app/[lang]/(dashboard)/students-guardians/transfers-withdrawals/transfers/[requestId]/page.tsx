"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { getTransferById } from "@/services/transfersWithdrawalsService";
import TransferRequestDetailsPage from "@/components/students-guardians/transfers-withdrawals/details/TransferRequestDetailsPage";

export default function TransferDetailsRoute() {
  const params = useParams();
  const requestId = params.requestId as string;

  const transfer = useMemo(() => getTransferById(requestId), [requestId]);

  if (!transfer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Transfer request not found</p>
        </div>
      </div>
    );
  }

  return <TransferRequestDetailsPage transfer={transfer} />;
}
