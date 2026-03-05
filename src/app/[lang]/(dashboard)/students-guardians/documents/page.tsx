import DocumentsCenter from "@/features/students-guardians/documents/pages/DocumentsCenter";
import { Suspense } from "react";
import MainLoader from "@/components/ui/loaders/MainLoader";
export default function DocumentsCenterPage() {
  return (<Suspense fallback={<MainLoader />}><DocumentsCenter /></Suspense>);
}
