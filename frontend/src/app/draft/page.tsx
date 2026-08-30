'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiGet, apiPost } from '@/lib/api';
import { Sparkles, Loader2, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const P = '#5A45FF';
const Ps = '#EDE9FE';
const BORDER = '#E2E8F0';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const UI = '"Inter", -apple-system, sans-serif';

export default function DraftPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [charCount, setCharCount]     = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await apiPost('/draft', { mode: 'draft', prompt: description });
      if (data) {
        router.push('/app?doc=' + data.sessionId);
      } else {
        throw new Error('Draft generation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the draft.');
      setGenerating(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <Loader2 size={24} color={P} style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const canGenerate = description.trim().length > 0 && !generating;

  return (
    <div style={{ minHeight: '100svh', background: '#F8FAFC', fontFamily: UI }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px 48px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Header */}
          <div style={{ paddingTop: 32, marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: Ps, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Sparkles size={24} color={P} />
            </div>
            <h1 style={{ fontFamily: '"Poppins", sans-serif', fontSize: 24, fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>
              AI Draft
            </h1>
            <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>
              Describe the document, letter, or clause you need. Our legal AI will draft it instantly.
            </p>
          </div>

          {/* Prompt textarea */}
          <form onSubmit={handleGenerate}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <textarea
                value={description}
                onChange={e => { setDescription(e.target.value); setCharCount(e.target.value.length); }}
                placeholder="e.g. Draft a non-disclosure agreement between Acme Ltd and John Doe for software development work. Include a 2-year confidentiality period and Nigerian law jurisdiction."
                disabled={generating}
                rows={8}
                style={{
                  width: '100%',
                  padding: '18px',
                  fontSize: 15,
                  lineHeight: 1.7,
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: 16,
                  background: 'white',
                  color: TEXT,
                  outline: 'none',
                  fontFamily: UI,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms, box-shadow 150ms',
                  opacity: generating ? 0.7 : 1,
                }}
                onFocus={e => { e.target.style.borderColor = P; e.target.style.boxShadow = `0 0 0 3px ${Ps}`; }}
                onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
              />
              <div style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 11, color: '#94A3B8' }}>
                {charCount} chars
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px', marginBottom: 14,
                background: '#FEF2F2', border: '1px solid #FCA5A5',
                borderRadius: 12, fontSize: 13, color: '#B91C1C', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Generate button */}
            <motion.button
              type="submit"
              disabled={!canGenerate}
              whileTap={canGenerate ? { scale: 0.97 } : undefined}
              style={{
                width: '100%', height: 54,
                background: canGenerate ? P : '#E2E8F0',
                border: 'none', borderRadius: 16,
                fontSize: 16, fontWeight: 700,
                color: canGenerate ? '#fff' : '#94A3B8',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
                fontFamily: UI,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background 150ms, box-shadow 150ms',
                boxShadow: canGenerate ? `0 4px 20px rgba(90,69,255,0.35)` : 'none',
              }}
            >
              {generating ? (
                <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Drafting your document…</>
              ) : (
                <><Sparkles size={18} /> Generate Draft <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          {/* Tips */}
          {!generating && (
            <div style={{
              marginTop: 24, padding: '16px',
              background: 'white', border: `1px solid ${BORDER}`,
              borderRadius: 16,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: MUTED, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Tips for better results
              </p>
              {[
                'Be specific — name the parties, amounts, and dates',
                'Mention the jurisdiction (e.g. Nigerian law)',
                'Specify any special clauses or terms you need',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
                  <span style={{ color: P, fontWeight: 700, fontSize: 13 }}>•</span>
                  <span style={{ fontSize: 13, color: MUTED }}>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
