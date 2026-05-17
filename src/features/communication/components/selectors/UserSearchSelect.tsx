"use client";

import { useCallback } from "react";
import { searchUsers } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search">;

export default function UserSearchSelect(props: Props) {
  const search = useCallback((query: string) => searchUsers(query), []);
  return <CommunicationEntitySelect {...props} search={search} />;
}
