import { getWithdrawalById } from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import WithdrawalRequestDetailsPage from "@/features/students-guardians/transfers-withdrawals/components/details/WithdrawalRequestDetailsPage";

export default async function WithdrawalDetailsRoute({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const withdrawal = getWithdrawalById(requestId);

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
