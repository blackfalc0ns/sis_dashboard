"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/**
 * Simple example showing how to use the Modal component
 * in a real application with translations
 */
export default function SimpleModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Welcome"
        footer={<Button onClick={() => setIsOpen(false)}>Close</Button>}
      >
        <p className="text-gray-600">
          This is a simple modal example with translations support.
        </p>
      </Modal>
    </div>
  );
}
