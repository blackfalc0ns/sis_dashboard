import { getTransferById } from "@/services/transfersWithdrawalsService";
import TransferRequestDetailsPage from "@/components/features/students-guardians/components/transfers-withdrawals/transfers-withdrawals/details/TransferRequestDetailsPage";

export default async function TransferDetailsRoute({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const transfer = getTransferById(requestId);

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
