'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sparkles, Loader2, FileText } from 'lucide-react';

export default function DraftPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'draft',
          prompt: description
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Draft generation failed.');

      router.push('/app?doc=' + data.sessionId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the draft.');
      setGenerating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 md:p-8 max-w-3xl mx-auto w-full">
      <header className="mb-8 mt-2 md:mt-0 text-center md:text-left">
        <div className="w-16 h-16 bg-[#E0E7FF] rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-4">
          <Sparkles className="w-8 h-8 text-[#4F46E5]" />
        </div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-[#0F172A] mb-2">AI Draft</h1>
        <p className="text-[#64748B] text-sm md:text-base max-w-lg mx-auto md:mx-0">
          Describe the document, letter, or clause you need. Our legal AI will instantly draft it for you.
        </p>
      </header>

      <form onSubmit={handleGenerate} className="flex flex-col gap-6 flex-1">
        <div className="flex-1 min-h-[300px] flex flex-col relative">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Draft a demand letter to Mr. John Smith regarding a ,000 unpaid debt for design services rendered on June 1st. Give him 14 days to pay."
            className="flex-1 w-full p-6 text-base md:text-lg border border-[#E2E8F0] rounded-3xl resize-none bg-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] shadow-sm leading-relaxed"
            disabled={generating}
            required
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={generating || !description.trim()}
          className="w-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#4F46E5]/20 text-lg md:text-xl"
        >
          {generating ? <Loader2 size={24} className="animate-spin" /> : <FileText size={24} />}
          {generating ? 'Drafting Document...' : 'Generate Draft'}
        </button>
      </form>
    </div>
  );
}
