"use client";

import { X } from "lucide-react";
import type { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren<{
  title: string;
  onClose: () => void;
}>;

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191a25]/45 p-4">
      <div className="w-full max-w-[520px] rounded-2xl border border-[#d8d9e2] bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="title-serif text-[30px] font-bold text-[#3f327d]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#666876] transition hover:bg-[#f1f2f6]"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
