"use client";

import { useState } from "react";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { IconButton, Menu, MenuItem } from "@mui/material";

export interface MessageActionsMenuLabels {
  edit: string;
  delete: string;
}

export interface MessageActionsMenuProps {
  labels: MessageActionsMenuLabels;
  disabled?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MessageActionsMenu({
  allowDelete = true,
  allowEdit = true,
  disabled,
  labels,
  onDelete,
  onEdit,
}: MessageActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const hasActions = allowEdit || allowDelete;

  const run = (action: () => void) => {
    setAnchorEl(null);
    action();
  };

  if (!hasActions) return null;

  return (
    <>
      <IconButton
        aria-label="Message actions"
        size="small"
        disabled={disabled}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <MoreVertical className="h-4 w-4" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {allowEdit ? (
          <MenuItem onClick={() => run(onEdit)}>
            <Edit className="me-2 h-4 w-4" />
            {labels.edit}
          </MenuItem>
        ) : null}
        {allowDelete ? (
          <MenuItem onClick={() => run(onDelete)}>
            <Trash2 className="me-2 h-4 w-4" />
            {labels.delete}
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}
