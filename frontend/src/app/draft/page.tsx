'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InktoWordmark } from '@/components/inkto-logo';

const C = {
  paper:   '#FBFAF7',
  border:  '#E4E1D9',
  ink:     '#0B0D12',
  inkMid:  '#444240',
  inkMute: '#6B6760',
  blue:    '#24467A',
  blueSub: '#EEF2F8',
  brass:   '#A6822C',
  brassS:  '#F8F2E6',
  red:     '#B23A34',
  warmMid: '#C8C4BA',
};

const UI      = '-apple-system, "Segoe UI", Roboto, sans-serif';
const DISPLAY = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

export default function DraftPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Agreement');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/draft');
    }
  }, [user, loading, router]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const token = localStorage.getItem('inkto_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Inkto-Auth'] = token;
      }

      const prompt = `Category: ${category}\nDescription: ${description}`;

      const res = await fetch('/api/draft', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'draft',
          prompt
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Draft generation failed.');
      }

      // Redirect to editor
      router.push(`/app?doc=${data.sessionId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the draft.');
      setGenerating(false);
    }
  };

  if (loading || (!user && !generating)) {
    return (
      <div style={{ minHeight: '100vh', background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin text-muted-foreground w-8 h-8" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.paper, color: C.ink, fontFamily: UI, padding: '24px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <button
            onClick={() => router.push('/app')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.inkMute, fontSize: 13, fontWeight: 600 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <InktoWordmark size={24} />
        </div>

        {generating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.blueSub, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s infinite' }}>
              <Sparkles size={28} color={C.blue} className="animate-pulse" />
            </div>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, margin: 0 }}>Gemini is drafting your document…</h2>
            <p style={{ fontSize: 13, color: C.inkMute, margin: 0, maxWidth: 300, lineHeight: 1.5 }}>
              Restructuring according to legal terms, formatting clauses, and standardizing signature sections under Nigerian law.
            </p>
          </div>
        ) : (
          <div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>AI Document Drafter</h1>
            <p style={{ fontSize: 14, color: C.inkMute, margin: '0 0 32px 0', lineHeight: 1.5 }}>
              Describe your legal document in plain words. Gemini will build a professional draft standardizing clauses under Nigerian legal syntax.
            </p>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.inkMute }}>
                  Document Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{
                    height: 48,
                    padding: '0 12px',
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    background: '#FFFFFF',
                    fontSize: 14,
                    color: C.ink,
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                >
                  <option>Agreement</option>
                  <option>Affidavit</option>
                  <option>Legal Letter</option>
                  <option>Power of Attorney</option>
                  <option>Will / Trust</option>
                  <option>Others</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.inkMute }}>
                  Description & Details
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="E.g., A tenancy agreement for a 3-bedroom apartment at Lekki Phase 1. Landlord Alhaji Tunde Cole, tenant Dr. Emeka Obi. Rent is N3.5M per year. Include clauses for 2-year duration, quarterly maintenance reviews, and utility payment schedules..."
                  required
                  style={{
                    height: 180,
                    padding: 12,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    color: C.ink,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: C.red, fontWeight: 600, margin: 0 }}>
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={!description.trim()}
                style={{
                  height: 52,
                  background: C.blue,
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 8,
                  marginTop: 12,
                  boxShadow: '0 4px 16px rgba(36, 70, 122, 0.15)'
                }}
              >
                Generate Document Draft
              </Button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
