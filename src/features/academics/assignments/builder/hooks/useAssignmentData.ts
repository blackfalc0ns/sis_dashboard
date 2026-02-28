import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Assignment,
  AssignmentQuestion,
  AssignmentAttachment,
  createAssignment,
  fetchAssignmentQuestions,
  fetchAssignmentAttachments,
} from "@/services/academics/curriculumService";

interface UseAssignmentDataProps {
  lessonId: string;
  assignmentId?: string;
}

interface UseAssignmentDataReturn {
  assignment: Assignment | null;
  questions: AssignmentQuestion[];
  attachments: AssignmentAttachment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setAssignment: (assignment: Assignment | null) => void;
  setQuestions: (questions: AssignmentQuestion[]) => void;
  setAttachments: React.Dispatch<React.SetStateAction<AssignmentAttachment[]>>;
}

export function useAssignmentData({
  lessonId,
  assignmentId,
}: UseAssignmentDataProps): UseAssignmentDataReturn {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const router = useRouter();
  const locale = useLocale();
  const hasCreatedDraft = useRef(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!assignmentId) {
        // Create new draft assignment
        if (hasCreatedDraft.current) return;
        hasCreatedDraft.current = true;

        const draft = await createAssignment(lessonId, {
          titleAr: "واجب جديد",
          titleEn: "New Assignment",
          isPublished: false,
        });

        // Redirect to edit page
        const params = new URLSearchParams(window.location.search);
        const newUrl = `/${locale}/academics/curriculum/lessons/${lessonId}/assignments/${draft.id}?${params.toString()}`;
        router.replace(newUrl);

        setAssignment(draft);
      } else {
        // Load existing assignment
        const stored = localStorage.getItem(`lesson-assignments-${lessonId}`);
        if (stored) {
          const assignments: Assignment[] = JSON.parse(stored);
          const found = assignments.find((a) => a.id === assignmentId);
          if (found) {
            setAssignment(found);

            // Load questions
            const qs = await fetchAssignmentQuestions(assignmentId);
            setQuestions(qs);

            // Load attachments
            const atts = await fetchAssignmentAttachments(assignmentId);
            setAttachments(atts);
          }
        }
      }
    } catch (err) {
      setError(err as Error);
      console.error("Failed to load assignment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, lessonId]);

  return {
    assignment,
    questions,
    attachments,
    loading,
    error,
    refetch: fetchData,
    setAssignment,
    setQuestions,
    setAttachments,
  };
}
