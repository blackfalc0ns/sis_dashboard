"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function ModalExamples() {
  const [basicModal, setBasicModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [largeModal, setLargeModal] = useState(false);
  const [noCloseModal, setNoCloseModal] = useState(false);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Modal Examples</h1>

      {/* Example 1: Basic Modal */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">1. Basic Modal</h2>
        <Button onClick={() => setBasicModal(true)}>Open Basic Modal</Button>

        <Modal
          isOpen={basicModal}
          onClose={() => setBasicModal(false)}
          title="Basic Modal"
        >
          <p className="text-gray-600">
            This is a basic modal with a title and close button. You can close
            it by clicking the X button, clicking outside, or pressing Escape.
          </p>
        </Modal>
      </section>

      {/* Example 2: Confirmation Modal */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          2. Confirmation Modal
        </h2>
        <Button onClick={() => setConfirmModal(true)}>Delete Item</Button>

        <Modal
          isOpen={confirmModal}
          onClose={() => setConfirmModal(false)}
          title="Confirm Deletion"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmModal(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  alert("Item deleted!");
                  setConfirmModal(false);
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-600">
                Are you sure you want to delete this item? This action cannot be
                undone.
              </p>
            </div>
          </div>
        </Modal>
      </section>

      {/* Example 3: Form Modal */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">3. Form Modal</h2>
        <Button onClick={() => setFormModal(true)}>Add New Student</Button>

        <Modal
          isOpen={formModal}
          onClose={() => setFormModal(false)}
          title="Add New Student"
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setFormModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  alert("Student added!");
                  setFormModal(false);
                }}
              >
                Save Student
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter student name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="student@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Grade 1</option>
                <option>Grade 2</option>
                <option>Grade 3</option>
              </select>
            </div>
          </form>
        </Modal>
      </section>

      {/* Example 4: Large Modal */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          4. Large Modal with Scrollable Content
        </h2>
        <Button onClick={() => setLargeModal(true)}>Open Large Modal</Button>

        <Modal
          isOpen={largeModal}
          onClose={() => setLargeModal(false)}
          title="Student Details"
          size="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-900">
                This modal has a lot of content and will scroll if needed.
              </p>
            </div>

            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Section {i + 1}
                </h3>
                <p className="text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            ))}
          </div>
        </Modal>
      </section>

      {/* Example 5: No Close on Outside Click */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          5. Modal with Restricted Closing
        </h2>
        <Button onClick={() => setNoCloseModal(true)}>
          Open Restricted Modal
        </Button>

        <Modal
          isOpen={noCloseModal}
          onClose={() => setNoCloseModal(false)}
          title="Important Notice"
          closeOnOverlayClick={false}
          closeOnEscape={false}
          footer={
            <Button onClick={() => setNoCloseModal(false)}>I Understand</Button>
          }
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 mb-4">
                This modal cannot be closed by clicking outside or pressing
                Escape. You must click the button below.
              </p>
              <p className="text-sm text-gray-500">
                This is useful for important confirmations or required actions.
              </p>
            </div>
          </div>
        </Modal>
      </section>
    </div>
  );
}
