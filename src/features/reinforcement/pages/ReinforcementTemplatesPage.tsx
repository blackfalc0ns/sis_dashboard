"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { useTranslations } from "next-intl";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementTemplatesTable from "../components/tables/ReinforcementTemplatesTable";
import ReinforcementTemplateModal from "../components/modals/ReinforcementTemplateModal";
import type {
  CreateReinforcementTemplatePayload,
  ReinforcementTemplate,
} from "../types/reinforcement";
import {
  createReinforcementTemplate,
  getReinforcementTemplates,
  updateReinforcementTemplate,
} from "../services/reinforcementService";

export default function ReinforcementTemplatesPage() {
  const t = useTranslations("reinforcement");
  const [templates, setTemplates] = useState<ReinforcementTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReinforcementTemplate | null>(null);

  useEffect(() => {
    getReinforcementTemplates().then(setTemplates);
  }, []);

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <ReinforcementPageHeader
        title={t("templates")}
        description={t("templatesDescription")}
        actions={
          <Button
            onClick={() => {
              setSelectedTemplate(null);
              setIsModalOpen(true);
            }}
          >
            {t("actions.createTemplate")}
          </Button>
        }
      />

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <ReinforcementTemplatesTable
          templates={templates}
          onEdit={(template) => {
            setSelectedTemplate(template);
            setIsModalOpen(true);
          }}
        />
      </div>

      <ReinforcementTemplateModal
        isOpen={isModalOpen}
        template={selectedTemplate}
        onClose={() => setIsModalOpen(false)}
        onSave={async (payload, id) => {
          if (id) {
            await updateReinforcementTemplate(
              id,
              payload as Partial<CreateReinforcementTemplatePayload>,
            );
          } else {
            await createReinforcementTemplate(
              payload as CreateReinforcementTemplatePayload,
            );
          }
          await getReinforcementTemplates().then(setTemplates);
        }}
      />
    </div>
  );
}
