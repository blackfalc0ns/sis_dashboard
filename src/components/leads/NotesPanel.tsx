// FILE: src/components/leads/NotesPanel.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, FileText } from "lucide-react";
import { Note } from "@/types/leads";

interface NotesPanelProps {
  notes: Note[];
  onAddNote: (body: string) => void;
}

export default function NotesPanel({ notes, onAddNote }: NotesPanelProps) {
  const t = useTranslations("admissions.notes_panel");
  const [showForm, setShowForm] = useState(false);
  const [noteBody, setNoteBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteBody.trim()) {
      onAddNote(noteBody);
      setNoteBody("");
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t("title")}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("add_note")}
        </button>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-lg p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("note_content")}
            </label>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm resize-none"
              placeholder={t("note_placeholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("save_note")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNoteBody("");
              }}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {t("no_notes")}
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {note.body}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{note.createdBy}</span>
                    <span>•</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
