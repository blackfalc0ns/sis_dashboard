"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUnsavedChanges } from "./UnsavedChangesProvider";
import Modal from "@/components/ui/modal/Modal";
import { useTranslations } from "next-intl";

interface NavigationGuardContextType {
  guardedNavigate: (action: () => void) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | undefined>(
  undefined
);

export function NavigationGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDirty } = useUnsavedChanges();
  const t = useTranslations("common");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // beforeunload handler for browser refresh/close
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const guardedNavigate = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        // No unsaved changes, proceed immediately
        action();
      } else {
        // Has unsaved changes, show confirm dialog
        setPendingAction(() => action);
        setIsDialogOpen(true);
      }
    },
    [isDirty]
  );

  const handleStay = () => {
    setIsDialogOpen(false);
    setPendingAction(null);
  };

  const handleLeave = () => {
    setIsDialogOpen(false);
    if (pendingAction) {
      pendingAction();
    }
    setPendingAction(null);
  };

  return (
    <NavigationGuardContext.Provider value={{ guardedNavigate }}>
      {children}
      
      <Modal
        isOpen={isDialogOpen}
        onClose={handleStay}
        title={t("unsavedChangesTitle")}
        size="sm"
        closeOnOverlayClick={false}
        closeOnEscape={true}
        footer={
          <>
            <button
              onClick={handleStay}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("stay")}
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              {t("leave")}
            </button>
          </>
        }
      >
        <p className="text-gray-600">{t("unsavedChangesBody")}</p>
      </Modal>
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error(
      "useNavigationGuard must be used within NavigationGuardProvider"
    );
  }
  return context;
}
