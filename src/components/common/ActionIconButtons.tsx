import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

export type ActionIconButtonsProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  viewLabel?: string;
};

export function ActionIconButtons({
  onEdit,
  onDelete,
  onView,
  editLabel = "Edit",
  deleteLabel = "Delete",
  viewLabel = "View",
}: ActionIconButtonsProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {onView ? (
        <Tooltip title={viewLabel}>
          <IconButton aria-label={viewLabel} color="primary" onClick={onView}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {onEdit ? (
        <Tooltip title={editLabel}>
          <IconButton aria-label={editLabel} color="primary" onClick={onEdit}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {onDelete ? (
        <Tooltip title={deleteLabel}>
          <IconButton aria-label={deleteLabel} color="error" onClick={onDelete}>
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}
