'use client';
import { ScannerContainer } from './scanner/ScannerContainer';

interface ScannerModalProps {
  onScanComplete: (pages: File[], pdfBlob: Blob) => void;
  onConvertToText: (pages: File[]) => void;
  onClose: () => void;
}

export default function ScannerModal({
  onScanComplete,
  onConvertToText,
  onClose,
}: ScannerModalProps) {
  return (
    <ScannerContainer
      onScanComplete={onScanComplete}
      onConvertToText={onConvertToText}
      onClose={onClose}
    />
  );
}
