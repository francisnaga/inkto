import { App } from '@capacitor/app';
import { compressImage } from './imageCompressor';
import { nanoid } from 'nanoid';
import { LocalQueue } from './local-queue';

const PAGE_CONCURRENCY = 3;

export async function startBackgroundTranscription(
  files: File[],
  customPrompt = '',
  existingSessionId?: string
) {
  const generatedSessionId = existingSessionId || nanoid(21);
  const totalPages = files.length;
  
  LocalQueue.addJob(generatedSessionId, `Processing ${totalPages} pages...`);
  
  const pageBlocks = new Array(totalPages);
  let nextIndex = 0;

  // Let Capacitor know this is a long-running background task
  let taskId: string | undefined;
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    taskId = await (App as any).runTask(async () => {
       await executeTranscription();
    });
  } else {
    // On web, just run it
    executeTranscription();
  }

  async function executeTranscription() {
    try {
      const transcribePage = async (index: number) => {
        const file = files[index];
        const pageNumber = index + 1;
        
        let uploadFile = file;
        if (file.type?.startsWith('image/')) {
          try {
            uploadFile = (await compressImage(file)) as File;
          } catch (e) {
            console.warn('Compression failed, using original:', e);
          }
        }

        const formData = new FormData();
        formData.append('files', uploadFile);
        if (customPrompt) formData.append('prompt', customPrompt);
        formData.append('sessionId', generatedSessionId);
        formData.append('startIndex', String(index));
        formData.append('pageNumber', String(pageNumber));
        formData.append('totalPages', String(totalPages));
        formData.append('isFinalBatch', 'false');
        formData.append('totalFilesCount', String(totalPages));

        const response = await fetch('https://inkto.jointaccount.org/api/transcribe', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const rawText = await response.text();
        let data: any = {};
        try { data = JSON.parse(rawText); } catch {}
        if (!response.ok) throw new Error(data.error || `Page ${pageNumber} failed.`);

        pageBlocks[index] = `--- Page ${pageNumber} ---\n${(data.text || '').trim()}`;
      };

      const runWorker = async () => {
        while (nextIndex < totalPages) {
          const index = nextIndex++;
          try {
            await transcribePage(index);
          } catch (err: any) {
            // Retry once
            if (!err.message?.includes('auth') && !err.message?.includes('configured')) {
              await transcribePage(index).catch(() => {
                pageBlocks[index] = `--- Page ${index + 1} ---\n[Failed to transcribe page]`;
              });
            }
          }
        }
      };

      const concurrency = Math.min(PAGE_CONCURRENCY, totalPages);
      await Promise.all(Array.from({ length: concurrency }, runWorker));

      const fullTranscript = pageBlocks.join('\n\n');

      // Finalize
      await fetch('https://inkto.jointaccount.org/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'finalize',
          sessionId: generatedSessionId,
          text: fullTranscript,
          totalFilesCount: totalPages
        })
      });
      LocalQueue.updateJobStatus(generatedSessionId, 'completed');
    } catch (err) {
      console.error('Background transcription failed completely:', err);
      LocalQueue.updateJobStatus(generatedSessionId, 'failed');
    } finally {
      if (taskId) {
        // @ts-ignore
        (App as any).finishTask({ taskId });
      }
    }
  }

  return generatedSessionId;
}



