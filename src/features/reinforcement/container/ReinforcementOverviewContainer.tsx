"use client";

import { useEffect, useState } from "react";
import type { ReinforcementOverview } from "../types/reinforcement";
import { getReinforcementOverview } from "../services/reinforcementService";
import ReinforcementOverviewPage from "../pages/ReinforcementOverviewPage";

export default function ReinforcementOverviewContainer() {
  const [overview, setOverview] = useState<ReinforcementOverview | null>(null);

  useEffect(() => {
    getReinforcementOverview().then(setOverview);
  }, []);

  return <ReinforcementOverviewPage initialOverview={overview} />;
}
