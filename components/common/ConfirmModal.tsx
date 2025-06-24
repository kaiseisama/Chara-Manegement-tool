import React from 'react';
import { Button } from './Button';
import { Card } from './Card'; // Card をモーダルの背景として使用

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode; // メッセージはReactノードを受け入れることで柔軟性を高める
  onConfirm: () => void;
  onCancel?: () => void; // onCancelを任意に変更
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: 'primary' | 'secondary' | 'danger';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel, // onCancelは任意
  confirmText,
  cancelText = "キャンセル",
  confirmButtonVariant = "primary",
}) => {
  if (!isOpen) {
    return null;
  }

  // onCancelが指定されていない場合、confirmTextのデフォルトを「OK」に設定
  const actualConfirmText = onCancel ? (confirmText || "実行") : (confirmText || "OK");

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onCancel} // Overlay click to cancel (if onCancel is provided)
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <Card 
        className="w-full max-w-md shadow-2xl border-sky-500"
        onClick={(e) => e.stopPropagation()} // Prevent card click from closing modal
      >
        <h3 id="confirm-modal-title" className="text-xl font-semibold text-sky-400 mb-4">{title}</h3>
        <div className="text-slate-300 mb-6 text-sm">
          {message}
        </div>
        <div className="flex justify-end space-x-3">
          {onCancel && ( // onCancelが提供されている場合のみキャンセルボタンを表示
            <Button variant="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          <Button variant={confirmButtonVariant} onClick={onConfirm}>
            {actualConfirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
};