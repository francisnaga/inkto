'use client';
import { useState, useEffect } from 'react';
import { X, FileText, UploadCloud, Plus, RefreshCw, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostScanResultProps {
  pages: File[];
  pdfBlob?: Blob;
  onAddPage: () => void;
  onRetake: () => void;
  onSaveAsPdf: () => void;
  onTranscribe: () => void;
  onSaveAndTranscribe: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function PostScanResult({
  pages,
  onAddPage,
  onRetake,
  onSaveAsPdf,
  onTranscribe,
  onSaveAndTranscribe,
  onCancel,
  isProcessing
}: PostScanResultProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = pages.map(p => URL.createObjectURL(p));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [pages]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <h2 className="text-xl font-bold">Scan complete</h2>
        <button onClick={onCancel} disabled={isProcessing} className="p-2 -mr-2 text-gray-500">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-sm">
          {/* Document Preview Gallery */}
          <div className="bg-gray-100 rounded-xl p-4 mb-4 flex gap-3 overflow-x-auto snap-x">
            {previews.map((src, i) => (
              <img 
                key={i} 
                src={src} 
                alt={`Page ${i+1}`} 
                className="h-48 w-auto object-contain rounded shadow-sm border snap-center shrink-0 bg-white"
              />
            ))}
          </div>
          <p className="text-center text-sm font-semibold text-gray-500 mb-6">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>

          <div className="flex gap-3 mb-8">
            <Button variant="outline" className="flex-1 h-12" onClick={onAddPage} disabled={isProcessing}>
              <Plus size={16} className="mr-2" /> Add page
            </Button>
            <Button variant="outline" className="flex-1 h-12" onClick={onRetake} disabled={isProcessing}>
              <RefreshCw size={16} className="mr-2" /> Retake
            </Button>
          </div>

          <div className="h-px bg-gray-200 mb-6 w-full" />
          <h3 className="text-sm font-bold text-gray-800 mb-4 text-center">What do you want to do?</h3>

          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full h-14 justify-start px-6 font-semibold border-2" 
              onClick={onSaveAsPdf}
              disabled={isProcessing}
            >
              <Save size={18} className="mr-3 text-emerald-600" />
              Save as PDF
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-14 justify-start px-6 font-semibold border-2" 
              onClick={onTranscribe}
              disabled={isProcessing}
            >
              <FileText size={18} className="mr-3 text-blue-600" />
              Transcribe
            </Button>

            <Button 
              className="w-full h-14 justify-start px-6 font-semibold bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={onSaveAndTranscribe}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 size={18} className="mr-3 animate-spin" />
              ) : (
                <UploadCloud size={18} className="mr-3" />
              )}
              {isProcessing ? 'Processing...' : 'Save + Transcribe'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
