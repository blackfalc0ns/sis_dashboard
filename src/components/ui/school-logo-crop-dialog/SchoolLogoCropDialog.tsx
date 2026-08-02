"use client";

import { useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import { createCroppedImage, type CropPixels } from "./cropImage";

export interface SchoolLogoCropDialogCopy {
  cancel: string;
  confirm: string;
  instruction: string;
  preparationFailed: string;
  preparing: string;
  rotate: string;
  rotation(degrees: number): string;
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

  const saveCrop = (_area: Area, pixels: Area) => {
    setCropPixels(pixels);
  };

  const confirmCrop = async () => {
    if (!cropPixels || isBusy) return;

    setIsPreparing(true);
    setPreparationError("");
    let croppedFile: File;

    try {
      croppedFile = await createCroppedImage(file, cropPixels, rotation);
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
          <Button disabled={isBusy} onClick={closeDialog} type="button" variant="secondary">
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
        <div className="relative h-80 overflow-hidden rounded-2xl bg-gray-950">
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
