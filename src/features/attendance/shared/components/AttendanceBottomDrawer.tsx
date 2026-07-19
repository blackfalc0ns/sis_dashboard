import type { PropsWithChildren } from "react";
import { Drawer, type DrawerProps } from "@mui/material";

interface AttendanceBottomDrawerProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  heightClassName?: string;
  anchor?: DrawerProps["anchor"];
}

export default function AttendanceBottomDrawer({
  isOpen,
  onClose,
  heightClassName = "h-[80vh]",
  anchor = "bottom",
  children,
}: AttendanceBottomDrawerProps) {
  return (
    <Drawer anchor={anchor} open={isOpen} onClose={onClose}>
      <div className={heightClassName}>{children}</div>
    </Drawer>
  );
}
