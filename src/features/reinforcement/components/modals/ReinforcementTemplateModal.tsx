"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import type {
  CreateReinforcementTemplatePayload,
  ReinforcementTemplate,
  ReinforcementTemplateStage,
} from "../../types/reinforcement";

interface ReinforcementTemplateModalProps {
  isOpen: boolean;
  template: ReinforcementTemplate | null;
  onClose: () => void;
  onSave: (
    payload:
      | CreateReinforcementTemplatePayload
      | Partial<CreateReinforcementTemplatePayload>,
    id?: string,
  ) => Promise<void>;
}

function blankStage(): ReinforcementTemplateStage {
  return {
    id: `stage-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    titleAr: "",
    titleEn: "",
    proofType: "none",
    descriptionAr: "",
    descriptionEn: "",
  };
}

export default function ReinforcementTemplateModal({
  isOpen,
  template,
  onClose,
  onSave,
}: ReinforcementTemplateModalProps) {
  const t = useTranslations("reinforcement.modal.template");
  const tCommon = useTranslations("common");
  const [draft, setDraft] = useState<CreateReinforcementTemplatePayload>({
    titleAr: "",
    titleEn: "",
    descriptionAr: "",
    descriptionEn: "",
    rewardType: "moral",
    rewardValue: "",
    isActive: true,
    stages: [blankStage()],
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setDraft({
        titleAr: template.titleAr,
        titleEn: template.titleEn,
        descriptionAr: template.descriptionAr,
        descriptionEn: template.descriptionEn,
        rewardType: template.rewardType,
        rewardValue: template.rewardValue,
        isActive: template.isActive,
        stages: template.stages,
      });
      return;
    }

    setDraft({
      titleAr: "",
      titleEn: "",
      descriptionAr: "",
      descriptionEn: "",
      rewardType: "moral",
      rewardValue: "",
      isActive: true,
      stages: [blankStage()],
    });
  }, [template, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft, template?.id);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? t("editTitle") : t("createTitle")}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            {template ? t("saveChanges") : t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t("titleAr")}
            value={draft.titleAr}
            onChange={(event) =>
              setDraft({ ...draft, titleAr: event.target.value })
            }
          />
          <Input
            label={t("titleEn")}
            value={draft.titleEn}
            onChange={(event) =>
              setDraft({ ...draft, titleEn: event.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextArea
            label={t("descriptionAr")}
            value={draft.descriptionAr}
            onChange={(event) =>
              setDraft({ ...draft, descriptionAr: event.target.value })
            }
          />
          <TextArea
            label={t("descriptionEn")}
            value={draft.descriptionEn}
            onChange={(event) =>
              setDraft({ ...draft, descriptionEn: event.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label={t("rewardType")}
            value={draft.rewardType}
            onChange={(value) =>
              setDraft({
                ...draft,
                rewardType:
                  value as CreateReinforcementTemplatePayload["rewardType"],
              })
            }
            options={[
              { value: "moral", label: t("rewardTypeOptions.moral") },
              { value: "financial", label: t("rewardTypeOptions.financial") },
              { value: "xp", label: t("rewardTypeOptions.xp") },
              { value: "badge", label: t("rewardTypeOptions.badge") },
            ]}
          />

          <Input
            label={t("rewardValue")}
            value={draft.rewardValue}
            onChange={(event) =>
              setDraft({ ...draft, rewardValue: event.target.value })
            }
          />

          <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) =>
                setDraft({ ...draft, isActive: event.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            {t("active")}
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("stages")}
            </h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setDraft({ ...draft, stages: [...draft.stages, blankStage()] })
              }
            >
              {t("addStage")}
            </Button>
          </div>
          {draft.stages.map((stage, index) => (
            <div
              key={stage.id}
              className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-5"
            >
              <Input
                label={`${t("stageTitleAr")} ${index + 1}`}
                value={stage.titleAr}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    stages: draft.stages.map((item) =>
                      item.id === stage.id
                        ? { ...item, titleAr: event.target.value }
                        : item,
                    ),
                  })
                }
              />
              <Input
                label={`${t("stageTitleEn")} ${index + 1}`}
                value={stage.titleEn}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    stages: draft.stages.map((item) =>
                      item.id === stage.id
                        ? { ...item, titleEn: event.target.value }
                        : item,
                    ),
                  })
                }
              />
              <Select
                label={t("proofType")}
                value={stage.proofType}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    stages: draft.stages.map((item) =>
                      item.id === stage.id
                        ? {
                            ...item,
                            proofType:
                              value as ReinforcementTemplateStage["proofType"],
                          }
                        : item,
                    ),
                  })
                }
                options={[
                  { value: "none", label: t("proofTypeOptions.none") },
                  { value: "image", label: t("proofTypeOptions.image") },
                  { value: "video", label: t("proofTypeOptions.video") },
                  { value: "document", label: t("proofTypeOptions.document") },
                ]}
              />
              <TextArea
                label={t("stageDescriptionAr")}
                value={stage.descriptionAr}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    stages: draft.stages.map((item) =>
                      item.id === stage.id
                        ? { ...item, descriptionAr: event.target.value }
                        : item,
                    ),
                  })
                }
                rows={2}
              />
              <div className="space-y-3">
                <TextArea
                  label={t("stageDescriptionEn")}
                  value={stage.descriptionEn}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      stages: draft.stages.map((item) =>
                        item.id === stage.id
                          ? { ...item, descriptionEn: event.target.value }
                          : item,
                      ),
                    })
                  }
                  rows={2}
                />
                {draft.stages.length > 1 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        stages: draft.stages.filter(
                          (item) => item.id !== stage.id,
                        ),
                      })
                    }
                  >
                    {t("removeStage")}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
