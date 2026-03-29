"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import type {
  CreateReinforcementRewardPayload,
  ReinforcementReward,
} from "../../types/reinforcement";

interface ReinforcementRewardModalProps {
  isOpen: boolean;
  reward: ReinforcementReward | null;
  onClose: () => void;
  onSave: (
    payload:
      | CreateReinforcementRewardPayload
      | Partial<CreateReinforcementRewardPayload>,
    id?: string,
  ) => Promise<void>;
}

export default function ReinforcementRewardModal({
  isOpen,
  reward,
  onClose,
  onSave,
}: ReinforcementRewardModalProps) {
  const t = useTranslations("reinforcement.modal.reward");
  const tCommon = useTranslations("common");
  const [draft, setDraft] = useState<CreateReinforcementRewardPayload>({
    nameAr: "",
    nameEn: "",
    type: "moral",
    defaultValue: "",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (reward) {
      setDraft({
        nameAr: reward.nameAr,
        nameEn: reward.nameEn,
        type: reward.type,
        defaultValue: reward.defaultValue,
        isActive: reward.isActive,
      });
      return;
    }

    setDraft({
      nameAr: "",
      nameEn: "",
      type: "moral",
      defaultValue: "",
      isActive: true,
    });
  }, [reward, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft, reward?.id);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reward ? t("editTitle") : t("createTitle")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            {reward ? t("saveChanges") : t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t("nameAr")}
            value={draft.nameAr}
            onChange={(event) =>
              setDraft({ ...draft, nameAr: event.target.value })
            }
          />
          <Input
            label={t("nameEn")}
            value={draft.nameEn}
            onChange={(event) =>
              setDraft({ ...draft, nameEn: event.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label={t("type")}
            value={draft.type}
            onChange={(value) =>
              setDraft({
                ...draft,
                type: value as CreateReinforcementRewardPayload["type"],
              })
            }
            options={[
              { value: "moral", label: t("typeOptions.moral") },
              { value: "financial", label: t("typeOptions.financial") },
              { value: "xp", label: t("typeOptions.xp") },
              { value: "badge", label: t("typeOptions.badge") },
            ]}
          />

          <Input
            label={t("defaultValue")}
            value={draft.defaultValue}
            onChange={(event) =>
              setDraft({ ...draft, defaultValue: event.target.value })
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
      </div>
    </Modal>
  );
}
