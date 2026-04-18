"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, Info, HelpCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "warning" | "danger" | "info";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "warning",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const icon = variant === "danger" ? (
    <AlertTriangle size={20} className="text-danger" />
  ) : variant === "warning" ? (
    <AlertTriangle size={20} className="text-warning" />
  ) : (
    <Info size={20} className="text-primary" />
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {icon}
          <div>
            <h3 className="text-sm font-bold mb-2">{title}</h3>
            <p className="text-xs text-muted leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
