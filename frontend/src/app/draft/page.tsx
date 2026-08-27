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
      const token = localStorage.getItem('inkto_session');
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
            <h2 style={{ fontFamily: UI, fontSize: 20, fontWeight: 700, margin: 0 }}>Inkto AI is drafting your document…</h2>
            <p style={{ fontSize: 13, color: C.inkMute, margin: 0, maxWidth: 300, lineHeight: 1.5 }}>
              Restructuring according to legal terms, formatting clauses, and standardizing signature sections under Nigerian law.
            </p>
          </div>
        ) : (
          <div>
            <h1 style={{ fontFamily: UI, fontSize: 26, fontWeight: 700, margin: '0 0 8px 0' }}>AI Document Drafter</h1>
            <p style={{ fontSize: 14, color: C.inkMute, margin: '0 0 32px 0', lineHeight: 1.5 }}>
              Describe the legal document you need. Inkto generates a complete, Nigerian law-compliant draft formatted for legal use.
            </p>

            {error && (
              <div style={{ padding: '12px 16px', background: '#FEF2F2', border: `1px solid ${C.red}33`, borderRadius: 8, color: C.red, fontSize: 13, marginBottom: 24 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.inkMid, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Document Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    height: 48,
                    padding: '0 16px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: '#FFFFFF',
                    color: C.ink,
                    fontSize: 14,
                    fontFamily: UI,
                    outline: 'none',
                  }}
                >
                  <option value="Agreement">Agreement (General)</option>
                  <option value="Tenancy & Lease">Tenancy & Lease Agreement</option>
                  <option value="Affidavit">Affidavit</option>
                  <option value="Employment">Employment Contract</option>
                  <option value="Non-Disclosure">Non-Disclosure Agreement (NDA)</option>
                  <option value="Power of Attorney">Power of Attorney</option>
                  <option value="Commercial">Commercial / Business Contract</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.inkMid, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Document Details & Requirements
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. A 1-year tenancy agreement for a 3-bedroom apartment in Lekki Phase 1 between Landlord Alhaji Sani and Tenant Mr. Emeka Obi. Rent is N3,500,000 per annum payable upfront..."
                  style={{
                    width: '100%',
                    padding: 16,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: '#FFFFFF',
                    color: C.ink,
                    fontSize: 14,
                    fontFamily: UI,
                    outline: 'none',
                    lineHeight: 1.6,
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ padding: 16, background: C.blueSub, borderRadius: 8, border: `1px solid ${C.blue}20` }}>
                <p style={{ fontSize: 12, color: C.blue, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  💡 Inkto automatically includes statutory Nigerian legal boilerplates, stamp duties sections, and standard attestation clauses.
                </p>
              </div>

              <Button
                type="submit"
                disabled={!description.trim()}
                style={{
                  height: 48,
                  background: C.blue,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: !description.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                <Sparkles size={16} /> Generate Draft with Inkto AI
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
