"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Coins, Sparkles, Star } from "lucide-react";
import Button from "@/components/ui/button/Button";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { useTranslations } from "next-intl";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementRewardsTable from "../components/tables/ReinforcementRewardsTable";
import ReinforcementRewardModal from "../components/modals/ReinforcementRewardModal";
import type {
  CreateReinforcementRewardPayload,
  ReinforcementReward,
} from "../types/reinforcement";
import {
  createReward,
  getReinforcementRewards,
  updateReward,
} from "../services/reinforcementService";

export default function ReinforcementRewardsPage() {
  const t = useTranslations("reinforcement");
  const [rewards, setRewards] = useState<ReinforcementReward[]>([]);
  const [selectedReward, setSelectedReward] = useState<ReinforcementReward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getReinforcementRewards().then(setRewards);
  }, []);

  const kpis = useMemo(
    () => ({
      total: rewards.length,
      active: rewards.filter((reward) => reward.isActive).length,
      financial: rewards.filter((reward) => reward.type === "financial").length,
      badges: rewards.filter((reward) => reward.type === "badge").length,
    }),
    [rewards],
  );

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <ReinforcementPageHeader
        title={t("rewards")}
        description={t("rewardsDescription")}
        actions={
          <Button
            onClick={() => {
              setSelectedReward(null);
              setIsModalOpen(true);
            }}
          >
            {t("actions.createReward")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICardV2 title={t("rewardsKpi.total")} value={kpis.total} icon={Award} iconColor="#036b80" iconBgColor="#e0f2f5" showChart={false} />
        <KPICardV2 title={t("rewardsKpi.active")} value={kpis.active} icon={Sparkles} iconColor="#16a34a" iconBgColor="#dcfce7" showChart={false} />
        <KPICardV2 title={t("rewardsKpi.financial")} value={kpis.financial} icon={Coins} iconColor="#0f766e" iconBgColor="#ccfbf1" showChart={false} />
        <KPICardV2 title={t("rewardsKpi.badges")} value={kpis.badges} icon={Star} iconColor="#d97706" iconBgColor="#fef3c7" showChart={false} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <ReinforcementRewardsTable
          rewards={rewards}
          onEdit={(reward) => {
            setSelectedReward(reward);
            setIsModalOpen(true);
          }}
        />
      </div>

      <ReinforcementRewardModal
        isOpen={isModalOpen}
        reward={selectedReward}
        onClose={() => setIsModalOpen(false)}
        onSave={async (payload, id) => {
          if (id) {
            await updateReward(id, payload as Partial<CreateReinforcementRewardPayload>);
          } else {
            await createReward(payload as CreateReinforcementRewardPayload);
          }
          await getReinforcementRewards().then(setRewards);
        }}
      />
    </div>
  );
}
