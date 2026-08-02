"use client";

import { useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import {
  createCroppedImage,
  DEFAULT_LOGO_CUSTOMIZATION,
  getLogoBackgroundColor,
  getLogoFilterValue,
  type CropPixels,
  type LogoCustomization,
} from "./cropImage";

export interface SchoolLogoCropDialogCopy {
  adjustments: string;
  background: string;
  backgroundCustom: string;
  backgroundTransparent: string;
  backgroundWhite: string;
  borderColor: string;
  borderWidth: string;
  brightness: string;
  cancel: string;
  confirm: string;
  contrast: string;
  filter: string;
  filterCool: string;
  filterGrayscale: string;
  filterOriginal: string;
  filterWarm: string;
  frame: string;
  frameCircle: string;
  frameSquare: string;
  instruction: string;
  preparationFailed: string;
  preparing: string;
  reset: string;
  rotate: string;
  rotation(degrees: number): string;
  saturation: string;
  title: string;
  zoom: string;
}

export interface SchoolLogoCropDialogProps {
  copy: SchoolLogoCropDialogCopy;
  file: File | null;
  isOpen: boolean;
  isUploading: boolean;
  onClose(): void;
  onConfirm(file: File): Promise<boolean>;
  uploadError: string;
}

type CropSessionProps = Omit<SchoolLogoCropDialogProps, "file" | "isOpen"> & {
  file: File;
};

const INITIAL_CROP: Point = { x: 0, y: 0 };

function getInitialCustomization(file: File): LogoCustomization {
  return {
    ...DEFAULT_LOGO_CUSTOMIZATION,
    background: file.type === "image/jpeg" ? "white" : "transparent",
  };
}

type LogoCustomizationControlsProps = {
  copy: SchoolLogoCropDialogCopy;
  customization: LogoCustomization;
  disabled: boolean;
  onChange(customization: LogoCustomization): void;
  onReset(): void;
};

function LogoCustomizationControls({
  copy,
  customization,
  disabled,
  onChange,
  onReset,
}: LogoCustomizationControlsProps) {
  const updateNumber = (
    key: "brightness" | "contrast" | "saturation" | "borderWidth",
    value: string,
  ) => {
    onChange({ ...customization, [key]: Number(value) });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {copy.adjustments}
        </h3>
        <Button
          disabled={disabled}
          onClick={onReset}
          type="button"
          variant="secondary"
        >
          {copy.reset}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <RangeControl
          copy={copy.brightness}
          disabled={disabled}
          max={150}
          min={50}
          onChange={(value) => updateNumber("brightness", value)}
          value={customization.brightness}
        />
        <RangeControl
          copy={copy.contrast}
          disabled={disabled}
          max={150}
          min={50}
          onChange={(value) => updateNumber("contrast", value)}
          value={customization.contrast}
        />
        <RangeControl
          copy={copy.saturation}
          disabled={disabled}
          max={150}
          min={0}
          onChange={(value) => updateNumber("saturation", value)}
          value={customization.saturation}
        />
        <RangeControl
          copy={copy.borderWidth}
          disabled={disabled}
          max={16}
          min={0}
          onChange={(value) => updateNumber("borderWidth", value)}
          value={customization.borderWidth}
        />
        <SelectControl
          copy={copy.filter}
          disabled={disabled}
          onChange={(filter) =>
            onChange({
              ...customization,
              filter: filter as LogoCustomization["filter"],
            })
          }
          options={[
            { label: copy.filterOriginal, value: "original" },
            { label: copy.filterGrayscale, value: "grayscale" },
            { label: copy.filterWarm, value: "warm" },
            { label: copy.filterCool, value: "cool" },
          ]}
          value={customization.filter}
        />
        <SelectControl
          copy={copy.background}
          disabled={disabled}
          onChange={(background) =>
            onChange({
              ...customization,
              background: background as LogoCustomization["background"],
            })
          }
          options={[
            { label: copy.backgroundTransparent, value: "transparent" },
            { label: copy.backgroundWhite, value: "white" },
            { label: copy.backgroundCustom, value: "custom" },
          ]}
          value={customization.background}
        />
        <SelectControl
          copy={copy.frame}
          disabled={disabled}
          onChange={(frame) =>
            onChange({
              ...customization,
              frame: frame as LogoCustomization["frame"],
            })
          }
          options={[
            { label: copy.frameSquare, value: "square" },
            { label: copy.frameCircle, value: "circle" },
          ]}
          value={customization.frame}
        />
        {customization.background === "custom" ? (
          <ColorControl
            copy={copy.backgroundCustom}
            disabled={disabled}
            onChange={(backgroundColor) =>
              onChange({ ...customization, backgroundColor })
            }
            value={customization.backgroundColor}
          />
        ) : null}
        <ColorControl
          copy={copy.borderColor}
          disabled={disabled}
          onChange={(borderColor) =>
            onChange({ ...customization, borderColor })
          }
          value={customization.borderColor}
        />
      </div>
    </section>
  );
}

type RangeControlProps = {
  copy: string;
  disabled: boolean;
  max: number;
  min: number;
  onChange(value: string): void;
  value: number;
};

function RangeControl({
  copy,
  disabled,
  max,
  min,
  onChange,
  value,
}: RangeControlProps) {
  return (
    <label className="block text-sm font-medium text-gray-800">
      <span>{copy}</span>
      <input
        aria-label={copy}
        className="mt-2 w-full accent-primary"
        disabled={disabled}
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={1}
        type="range"
        value={value}
      />
    </label>
  );
}

type SelectControlProps = {
  copy: string;
  disabled: boolean;
  onChange(value: string): void;
  options: Array<{ label: string; value: string }>;
  value: string;
};

function SelectControl({
  copy,
  disabled,
  onChange,
  options,
  value,
}: SelectControlProps) {
  return (
    <label className="block text-sm font-medium text-gray-800">
      <span>{copy}</span>
      <select
        aria-label={copy}
        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type ColorControlProps = {
  copy: string;
  disabled: boolean;
  onChange(value: string): void;
  value: string;
};

function ColorControl({ copy, disabled, onChange, value }: ColorControlProps) {
  return (
    <label className="block text-sm font-medium text-gray-800">
      <span>{copy}</span>
      <input
        aria-label={copy}
        className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white p-1"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        type="color"
        value={value}
      />
    </label>
  );
}

export function SchoolLogoCropDialog({
  copy,
  file,
  isOpen,
  isUploading,
  onClose,
  onConfirm,
  uploadError,
}: SchoolLogoCropDialogProps) {
  if (!isOpen || !file) return null;

  return (
    <CropSession
      copy={copy}
      file={file}
      isUploading={isUploading}
      onClose={onClose}
      onConfirm={onConfirm}
      uploadError={uploadError}
    />
  );
}

function CropSession({
  copy,
  file,
  isUploading,
  onClose,
  onConfirm,
  uploadError,
}: CropSessionProps) {
  const [crop, setCrop] = useState<Point>(INITIAL_CROP);
  const [cropPixels, setCropPixels] = useState<CropPixels | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparationError, setPreparationError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [customization, setCustomization] = useState<LogoCustomization>(() =>
    getInitialCustomization(file),
  );

  useEffect(() => {
    let active = true;
    const objectUrl = URL.createObjectURL(file);

    void Promise.resolve().then(() => {
      if (active) setPreviewUrl(objectUrl);
    });

    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const isBusy = isPreparing || isUploading;
  const error = preparationError || uploadError;

  const closeDialog = () => {
    if (!isBusy) onClose();
  };

  const resetEditor = () => {
    setCrop(INITIAL_CROP);
    setCropPixels(null);
    setRotation(0);
    setZoom(1);
    setCustomization(getInitialCustomization(file));
  };

  const saveCrop = (_area: Area, pixels: Area) => {
    setCropPixels(pixels);
  };

  const confirmCrop = async () => {
    if (!cropPixels || isBusy) return;

    setIsPreparing(true);
    setPreparationError("");
    let croppedFile: File;

    try {
      croppedFile = await createCroppedImage(
        file,
        cropPixels,
        rotation,
        customization,
      );
    } catch {
      setPreparationError(copy.preparationFailed);
      setIsPreparing(false);
      return;
    }

    const uploaded = await onConfirm(croppedFile);
    setIsPreparing(false);
    if (uploaded) onClose();
  };

  return (
    <Modal
      closeOnEscape={!isBusy}
      closeOnOverlayClick={!isBusy}
      footer={
        <>
          <Button
            disabled={isBusy}
            onClick={closeDialog}
            type="button"
            variant="secondary"
          >
            {copy.cancel}
          </Button>
          <Button
            disabled={isBusy || !cropPixels}
            loading={isBusy}
            onClick={() => void confirmCrop()}
            type="button"
          >
            {copy.confirm}
          </Button>
        </>
      }
      isOpen
      onClose={closeDialog}
      showCloseButton={!isBusy}
      size="xl"
      title={copy.title}
    >
      <div className="space-y-5 pb-4">
        <p className="text-sm text-gray-600">{copy.instruction}</p>
        <div
          className="relative h-80 overflow-hidden bg-gray-950"
          style={{
            backgroundColor:
              getLogoBackgroundColor(file, customization) ?? undefined,
            border: customization.borderWidth
              ? `${customization.borderWidth}px solid ${customization.borderColor}`
              : undefined,
            borderRadius: customization.frame === "circle" ? "50%" : "1rem",
            filter: getLogoFilterValue(customization),
          }}
        >
          {previewUrl ? (
            <Cropper
              aspect={1}
              crop={crop}
              image={previewUrl}
              minZoom={1}
              onCropChange={setCrop}
              onCropComplete={saveCrop}
              onRotationChange={setRotation}
              onZoomChange={setZoom}
              rotation={rotation}
              showGrid={false}
              zoom={zoom}
            />
          ) : null}
        </div>
        <LogoCustomizationControls
          copy={copy}
          customization={customization}
          disabled={isBusy}
          onChange={setCustomization}
          onReset={resetEditor}
        />
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm font-medium text-gray-800">
            <span>{copy.zoom}</span>
            <input
              aria-label={copy.zoom}
              className="mt-2 w-full accent-primary"
              disabled={isBusy}
              max={3}
              min={1}
              onChange={(event) => setZoom(Number(event.target.value))}
              step={0.1}
              type="range"
              value={zoom}
            />
          </label>
          <div className="flex items-center gap-3">
            <Button
              disabled={isBusy}
              onClick={() => setRotation((current) => (current + 90) % 360)}
              type="button"
              variant="secondary"
            >
              {copy.rotate}
            </Button>
            <span aria-live="polite" className="text-sm text-gray-600">
              {copy.rotation(rotation)}
            </span>
          </div>
        </div>
        {isPreparing ? (
          <p aria-live="polite" className="text-sm text-gray-600">
            {copy.preparing}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
