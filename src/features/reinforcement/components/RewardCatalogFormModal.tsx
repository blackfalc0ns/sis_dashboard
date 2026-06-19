"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Select from "@/components/ui/input/Select";
import Modal from "@/components/ui/modal/Modal";
import type {
  RewardCatalogItem,
  RewardItemType,
  CreateRewardCatalogItemPayload,
  UpdateRewardCatalogItemPayload,
} from "@/features/reinforcement/types";

interface RewardCatalogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateRewardCatalogItemPayload | UpdateRewardCatalogItemPayload,
  ) => Promise<void> | void;
  initialData?: RewardCatalogItem | null;
  loading?: boolean;
}

const REWARD_TYPE_OPTIONS: { value: RewardItemType; label: string }[] = [
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "privilege", label: "Privilege" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

export default function RewardCatalogFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: RewardCatalogFormModalProps) {
  const t = useTranslations("reinforcement");
  const tCommon = useTranslations("common");

  const isEditMode = !!initialData;

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [type, setType] = useState<RewardItemType>("physical");
  const [minTotalXp, setMinTotalXp] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitleEn(initialData.titleEn || "");
      setTitleAr(initialData.titleAr || "");
      setDescriptionEn(initialData.descriptionEn || "");
      setDescriptionAr(initialData.descriptionAr || "");
      setType(initialData.type || "physical");
      setMinTotalXp(
        initialData.minTotalXp != null ? String(initialData.minTotalXp) : "",
      );
      setStockQuantity(
        initialData.stockQuantity != null
          ? String(initialData.stockQuantity)
          : "",
      );
      setIsUnlimited(initialData.isUnlimited ?? false);
      setSortOrder(
        initialData.sortOrder != null ? String(initialData.sortOrder) : "",
      );
    } else {
      setTitleEn("");
      setTitleAr("");
      setDescriptionEn("");
      setDescriptionAr("");
      setType("physical");
      setMinTotalXp("");
      setStockQuantity("");
      setIsUnlimited(false);
      setSortOrder("");
    }
    setValidationError(null);
  }, [isOpen, initialData]);

  const typeOptions = REWARD_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(`rewardsModule.type.${opt.value}`),
  }));

  const handleSubmit = () => {
    // Validation: at least one title required
    if (!titleEn.trim() && !titleAr.trim()) {
      setValidationError(
        t("validation.atLeastOneTitle", {
          defaultMessage: "At least one title (English or Arabic) is required.",
        }),
      );
      return;
    }

    setValidationError(null);

    if (isEditMode) {
      const payload: UpdateRewardCatalogItemPayload = {
        titleEn: titleEn.trim() || undefined,
        titleAr: titleAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionAr: descriptionAr.trim() || undefined,
        type,
        minTotalXp: minTotalXp ? Number(minTotalXp) : undefined,
        stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
        isUnlimited,
        sortOrder: sortOrder ? Number(sortOrder) : undefined,
      };
      onSubmit(payload);
    } else {
      const payload: CreateRewardCatalogItemPayload = {
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionAr: descriptionAr.trim() || undefined,
        type,
        minTotalXp: minTotalXp ? Number(minTotalXp) : undefined,
        stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
        isUnlimited,
        sortOrder: sortOrder ? Number(sortOrder) : undefined,
      };
      onSubmit(payload);
    }
  };

  const modalTitle = isEditMode
    ? t("rewardsModule.actions.edit") + " " + t("rewardsModule.catalog.title")
    : t("rewardsModule.actions.create") +
      " " +
      t("rewardsModule.catalog.title");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            {isEditMode
              ? tCommon("save", { defaultMessage: "Save" })
              : t("rewardsModule.actions.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Title fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t("rewardsModule.catalog.table.title") + " (EN)"}
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Reward title in English"
            required={!titleAr.trim()}
          />
          <Input
            label={t("rewardsModule.catalog.table.title") + " (AR)"}
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder={t("rewards.titlePlaceholderAr")}
            dir="rtl"
            required={!titleEn.trim()}
          />
        </div>

        {/* Description fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextArea
            label={`${t("rewardsModule.description")} (EN)`}
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            placeholder="Description in English"
            rows={3}
          />
          <TextArea
            label={`${t("rewardsModule.description")} (AR)`}
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            placeholder={t("rewards.descriptionPlaceholderAr")}
            dir="rtl"
            rows={3}
          />
        </div>

        {/* Type select */}
        <Select
          label={t("rewardsModule.catalog.table.type")}
          options={typeOptions}
          value={type}
          onChange={(val) => setType(val as RewardItemType)}
          required
        />

        {/* Numeric fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label={t("rewardsModule.catalog.table.xpCost")}
            type="number"
            value={minTotalXp}
            onChange={(e) => setMinTotalXp(e.target.value)}
            placeholder="0"
          />
          <Input
            label={t("rewardsModule.catalog.table.stock")}
            type="number"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            placeholder="0"
            disabled={isUnlimited}
          />
          <Input
            label="Sort Order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Unlimited checkbox */}
        <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isUnlimited}
            onChange={(e) => setIsUnlimited(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <p className="font-medium text-gray-900">
              Unlimited Stock
            </p>
            <p className="mt-1 text-xs text-gray-500">
              When enabled, this reward has no stock limit.
            </p>
          </div>
        </label>

        {/* Validation error */}
        {validationError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {validationError}
          </div>
        )}
      </div>
    </Modal>
  );
}
