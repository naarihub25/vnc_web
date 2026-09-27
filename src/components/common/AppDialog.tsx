import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

export type AppDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  onClose: () => void;
};

export function AppDialog({
  open,
  title,
  children,
  actions,
  maxWidth = "sm",
  onClose,
}: AppDialogProps) {
  return (
    <Dialog fullWidth maxWidth={maxWidth} open={open} onClose={onClose}>
      <DialogTitle sx={{ pr: 7 }}>
        {title}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>{children}</Stack>
      </DialogContent>
      {actions ? (
        <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>
      ) : null}
    </Dialog>
  );
}
