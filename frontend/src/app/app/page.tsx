'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Capacitor } from '@capacitor/core';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Camera, Mic, Upload, PenTool, ChevronRight, FileText, FileAudio, Loader2 } from 'lucide-react';
import { ScannerService } from '@/lib/ScannerService';
import { startBackgroundTranscription } from '@/lib/background-transcriber';
import { PostScanResult } from '@/components/scanner/PostScanResult';
import { useTranscribe } from '@/hooks/useTranscribe';
import { apiGet, apiPostForm } from '@/lib/api';

const ScannerModal = dynamic(() => import('@/components/scanner-modal'), { ssr: false });
const DictateModal = dynamic(() => import('@/components/dictate-modal'), { ssr: false });
const OutputBox    = dynamic(() => import('@/components/output-box'), { ssr: false });

interface RecentFile {
  id: string;
  title: string;
  type: 'scan' | 'transcription' | 'voice' | 'draft';
  createdAt: string;
}

function AppPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const {
    state, error, transcribedText,
    sessionId, sessionImages, audioUrl,
    reset, fetchSession,
  } = useTranscribe();

  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showDictate, setShowDictate] = useState(false);
  const [postScanData, setPostScanData] = useState<{ pages: File[], pdfBlob?: Blob } | null>(null);
  const [postScanProcessing, setPostScanProcessing] = useState(false);

  const docId = searchParams.get('doc');
  useEffect(() => { if (docId) fetchSession(docId); }, [docId, fetchSession]);

  useEffect(() => {
    // Listen for custom event from BottomNav FAB
    const handleScanTrigger = () => startNativeScanner();
    window.addEventListener('inkto-scan-trigger', handleScanTrigger);
    return () => window.removeEventListener('inkto-scan-trigger', handleScanTrigger);
  }, []);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await apiGet<{ documents: RecentFile[] }>('/history', { limit: '4' });
        setRecentFiles(data.documents || []);
      } catch (e) {
        console.error('Failed to fetch recent files', e);
      }
    };
    fetchRecent();
  }, [state, postScanProcessing]); // Refetch when processing changes

  const firstName = user?.displayName
    ? user.displayName.split(' ')[0]
    : user?.email
      ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'User';

  const startNativeScanner = async () => {
    if (Capacitor.isNativePlatform()) {
      const res = await ScannerService.scanNative();
      if (res && res.pages.length > 0) setPostScanData(res);
    } else {
      setShowScanner(true);
    }
  };

  const handleWebScanComplete = (pages: File[], pdfBlob: Blob) => {
    setShowScanner(false);
    setPostScanData({ pages, pdfBlob });
  };

  const uploadPdfToStorage = async (blob: Blob, pagesCount: number): Promise<{url: string, id: string}> => {
    const name = `scan-${new Date().toISOString().slice(0, 10)}-${pagesCount}p.pdf`;
    const fd = new FormData();
    fd.append('file', blob, name);
    fd.append('title', name);
    const data = await apiPostForm<{ id: string }>('/save-scan', fd);
    return { url: '', id: data.id };
  };

  const handlePostScanSaveAndTranscribe = async () => {
    if (!postScanData) return;
    setPostScanProcessing(true);
    try {
      let existingId = undefined;
      if (postScanData.pdfBlob) {
        const { id } = await uploadPdfToStorage(postScanData.pdfBlob, postScanData.pages.length);
        existingId = id;
      }
      await startBackgroundTranscription(postScanData.pages, '', existingId);
      setPostScanData(null);
      router.push('/history');
    } catch (e) {
        console.error(e);
        alert('Failed to save and transcribe');
    } finally { setPostScanProcessing(false); }
  };

  const handlePostScanTranscribe = async () => {
    if (!postScanData) return;
    setPostScanProcessing(true);
    try {
      await startBackgroundTranscription(postScanData.pages);
      setPostScanData(null);
      router.push('/history');
    } catch (e) {
        console.error(e);
        alert('Failed to transcribe');
    } finally { setPostScanProcessing(false); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      startBackgroundTranscription(Array.from(e.target.files));
      if (e.target) e.target.value = '';
      router.push('/history');
  };

  // State renders
  if (state === 'fetching_session') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 text-[#4F46E5] animate-spin" />
        <span className="text-sm text-[#64748B]">Loading document...</span>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <OutputBox
        text={transcribedText}
        sessionId={sessionId}
        images={sessionImages}
        audioUrl={audioUrl}
        onReset={() => {
            reset();
            router.replace('/app');
        }}
      />
    );
  }

  return (
    <>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <header className="mb-8 mt-2 md:mt-0">
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#0F172A] mb-1">
            Hello, {firstName}
          </h1>
          <p className="text-[#64748B] text-sm">
            What would you like to do today?
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button onClick={startNativeScanner} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3 active:scale-95">
            <div className="w-12 h-12 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">
              <Camera size={24} />
            </div>
            <span className="font-semibold text-sm text-[#0F172A]">Scan Document</span>
          </button>

          <button onClick={() => setShowDictate(true)} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3 active:scale-95">
            <div className="w-12 h-12 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">
              <Mic size={24} />
            </div>
            <span className="font-semibold text-sm text-[#0F172A]">Record Audio</span>
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3 active:scale-95">
            <div className="w-12 h-12 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">
              <Upload size={24} />
            </div>
            <span className="font-semibold text-sm text-[#0F172A]">Upload File</span>
          </button>

          {/* Hidden file inputs */}
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf,audio/*" onChange={handleInput} />
          <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleInput} />

          <button onClick={() => cameraInputRef.current?.click()} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3 active:scale-95">
            <div className="w-12 h-12 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">
              <PenTool size={24} />
            </div>
            <span className="font-semibold text-sm text-[#0F172A]">Handwriting</span>
          </button>
        </div>

        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold font-display text-[#0F172A]">Recent Files</h2>
            <Link href="/history" className="text-sm font-semibold text-[#4F46E5] hover:underline">
              View All
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col divide-y divide-[#E2E8F0]">
            {recentFiles.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8] text-sm">
                No recent files found.
              </div>
            ) : (
              recentFiles.map((file) => {
                  const isAudio = file.type === 'voice';
                  return (
                    <Link href={`/app?doc=` + file.id} key={file.id} className="flex items-center p-4 hover:bg-[#F8FAFC] transition-colors active:bg-[#F1F5F9]">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isAudio ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                        {isAudio ? <FileAudio size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-[#0F172A] truncate">{file.title}</h3>
                        <p className="text-xs text-[#94A3B8] mt-0.5 truncate">
                          {new Date(file.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-[#CBD5E1]" />
                    </Link>
                  );
              })
            )}
          </div>
        </section>
      </div>

      {showScanner && (
        <ScannerModal
          onScanComplete={handleWebScanComplete}
          onConvertToText={(pages) => { setShowScanner(false); handleWebScanComplete(pages, new Blob()); }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showDictate && (
        <DictateModal
          onClose={() => setShowDictate(false)}
          onTranscribeComplete={() => { setShowDictate(false); router.push('/history'); }}
        />
      )}

      {postScanData && (
        <PostScanResult
          pages={postScanData.pages}
          isProcessing={postScanProcessing}
          onTranscribe={handlePostScanTranscribe}
          onSaveAndTranscribe={handlePostScanSaveAndTranscribe}
          onCancel={() => setPostScanData(null)}
          onAddPage={() => {}}
          onRetake={() => {}}
          onSaveAsPdf={async () => {}}
        />
      )}
    </>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={<div className="h-[200px]" />}>
      <AppPageContent />
    </Suspense>
  );
}
