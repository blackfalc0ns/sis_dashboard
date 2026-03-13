import type { PropsWithChildren } from "react";
import { Drawer } from "@mui/material";

interface AttendanceBottomDrawerProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  heightClassName?: string;
}

export default function AttendanceBottomDrawer({
  isOpen,
  onClose,
  heightClassName = "h-[80vh]",
  children,
}: AttendanceBottomDrawerProps) {
  return (
    <Drawer anchor="bottom" open={isOpen} onClose={onClose}>
      <div className={heightClassName}>{children}</div>
    </Drawer>
  );
}
