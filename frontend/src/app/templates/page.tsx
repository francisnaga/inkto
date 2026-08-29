'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ChevronRight, FileText, Search, FileDown, File, Loader2, PenTool, Sparkles, X, History, ClipboardPaste } from 'lucide-react';

async function downloadFile(endpoint: string, text: string, filename: string, fallbackMsg: string) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const msg = ct.includes('json') ? (await res.json()).error : await res.text();
      throw new Error(msg || fallbackMsg);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    alert(err.message || fallbackMsg);
  }
}

// ── Template data ──────────────────────────────────────────────────────────
const TEMPLATE_CATEGORIES = [
  {
    id: 'affidavits', name: 'Affidavits', icon: '📜',
    templates: [
      { id: 'general-affidavit', name: 'General Affidavit', content: IN THE HIGH COURT OF [STATE] STATE\nIN THE [JUDICIAL DIVISION] JUDICIAL DIVISION\nHOLDEN AT [CITY]\n\nAFFIDAVIT OF [PURPOSE]\n\nI, [Name of Deponent], [Religion], [Nationality], [Occupation], residing at [Address], do hereby make oath and state as follows:\n\n1. That I am the Deponent herein.\n2. That [Fact 1].\n3. That [Fact 2].\n4. That I swear to this Affidavit in good faith.\n\n_______________________\nDEPONENT\n\nSworn to at the Registry of the High Court\nThis ______ day of ______________ 20____\n\nBEFORE ME\n\n_______________________\nCOMMISSIONER FOR OATHS }
    ]
  },
  {
    id: 'agreements', name: 'Agreements & Contracts', icon: '🤝',
    templates: [
      { id: 'nda', name: 'Non-Disclosure Agreement', content: NON-DISCLOSURE AGREEMENT\n\nThis Agreement is made on this [Day] day of [Month], [Year] by and between:\n\n1. [Disclosing Party Name], of [Address] (the "Disclosing Party"); and\n2. [Receiving Party Name], of [Address] (the "Receiving Party").\n\nThe Parties agree as follows:\n\n1. Confidential Information: All non-public information disclosed by the Disclosing Party.\n2. Obligations: The Receiving Party shall not disclose the information to third parties.\n\nSignatures:\n\n_______________________          _______________________\nDisclosing Party                 Receiving Party },
      { id: 'lease-agreement', name: 'Lease Agreement', content: LEASE AGREEMENT\n\nThis Lease Agreement is entered into on [Date] by:\n\nLANDLORD: [Landlord Name]\nTENANT: [Tenant Name]\n\nPROPERTY: [Address of Property]\n\nTERMS:\n1. Rent: [Amount] per [Month/Year]\n2. Duration: [Months/Years]\n\nSignatures:\n\n_______________________          _______________________\nLandlord                         Tenant }
    ]
  },
  {
    id: 'corporate', name: 'Corporate & Business', icon: '🏢',
    templates: [
      { id: 'board-resolution', name: 'Board Resolution', content: BOARD RESOLUTION OF [COMPANY NAME]\n\nDate: [Date]\n\nIT WAS RESOLVED THAT:\n\n1. [Resolution 1]\n2. [Resolution 2]\n\n_______________________\nDIRECTOR / SECRETARY }
    ]
  },
  {
    id: 'letters', name: 'Letters & Notices', icon: '✉️',
    templates: [
      { id: 'demand-notice', name: 'Demand Notice', content: [Your Letterhead]\n[Date]\n\n[Recipient Name]\n[Recipient Address]\n\nDear [Name],\n\nDEMAND NOTICE FOR [SUBJECT]\n\nWe act as Solicitors to [Client Name] on whose instructions we write.\n\nTake notice that you are required to [Demand Action] within [Number] days.\n\nYours faithfully,\n\n_______________________\n[Lawyer/Firm Name] }
    ]
  }
];

type View = 'categories' | 'list' | 'editor' | 'ai-draft';
type Category = typeof TEMPLATE_CATEGORIES[0];
type Template = typeof TEMPLATE_CATEGORIES[0]['templates'][0];

export default function TemplatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  const [view, setView] = useState<View>('categories');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorContent, setEditorContent] = useState('');
  
  const [fittingTemplate, setFittingTemplate] = useState<Template | null>(null);
  const [fittingInput, setFittingInput] = useState('');
  const [isFitting, setIsFitting] = useState(false);
  const [fitSourceMode, setFitSourceMode] = useState<'select' | 'paste' | 'history'>('select');
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  const fetchHistory = async () => {
    if (historyItems.length > 0) return;
    try {
      const res = await fetch('/api/history?limit=15');
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCategory = (c: Category) => {
    setActiveCategory(c);
    setView('list');
  };

  const handleSelectTemplate = (t: Template) => {
    setActiveTemplate(t);
    setEditorContent(t.content);
    setView('editor');
  };

  const handleBack = () => {
    if (view === 'editor') {
      setView(activeCategory ? 'list' : 'categories');
      setActiveTemplate(null);
    } else if (view === 'list') {
      setView('categories');
      setActiveCategory(null);
    } else if (view === 'ai-draft') {
      setView(activeCategory ? 'list' : 'categories');
      setFittingTemplate(null);
      setFittingInput('');
    }
  };

  const handleAiFit = async () => {
    if (!fittingInput.trim() || !fittingTemplate) return;
    setIsFitting(true);
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: Fill this template with the provided details. Output ONLY the filled template text.\n\nTEMPLATE:\n\n\nDETAILS:\n,
          format: 'text',
        }),
      });
      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();
      setEditorContent(data.draft);
      setActiveTemplate(fittingTemplate);
      setView('editor');
    } catch (err) {
      alert('Failed to customize template with AI.');
    } finally {
      setIsFitting(false);
    }
  };

  const handleDownloadPdf = () => downloadFile('/api/download-pdf', editorContent, 'Template.pdf', 'Failed to generate PDF');
  const handleDownloadDocx = () => downloadFile('/api/download-docx', editorContent, 'Template.docx', 'Failed to generate DOCX');

  const allTemplates = searchQuery
    ? TEMPLATE_CATEGORIES.flatMap(cat => cat.templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => ({ ...t, categoryName: cat.name, category: cat })))
    : [];

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Editor view ──
  if (view === 'editor' && activeTemplate) {
    return (
      <div className="flex flex-col h-full p-6 md:p-8 max-w-4xl mx-auto">
        <header className="mb-6 flex items-center gap-3 mt-2 md:mt-0">
          <button onClick={handleBack} className="text-[#64748B] hover:text-[#0F172A] p-2 -ml-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
            ← Back
          </button>
          <span className="text-[#E2E8F0]">/</span>
          <h1 className="text-lg font-semibold text-[#0F172A] truncate">{activeTemplate.name}</h1>
        </header>

        <div className="mb-4 p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-800 font-medium flex items-start gap-2">
          <span>⚠️</span>
          <span>Review all content before use. Inkto is a document tool, not a law firm, and does not provide legal advice.</span>
        </div>

        <textarea
          value={editorContent}
          onChange={e => setEditorContent(e.target.value)}
          className="flex-1 w-full p-5 text-sm font-mono border border-[#E2E8F0] rounded-2xl resize-none bg-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] shadow-sm mb-4"
          placeholder="Template content will appear here..."
        />

        <div className="grid grid-cols-2 gap-3 pb-8">
          <button onClick={handleDownloadPdf} className="flex items-center justify-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] font-semibold py-3.5 rounded-xl transition-colors">
            <FileDown size={18} /> Save PDF
          </button>
          <button onClick={handleDownloadDocx} className="flex items-center justify-center gap-2 bg-[#4F46E5] text-white hover:bg-[#4338CA] font-semibold py-3.5 rounded-xl transition-colors shadow-sm shadow-[#4F46E5]/20">
            <File size={18} /> Save Word
          </button>
        </div>
      </div>
    );
  }

  // ── AI Draft view ──
  if (view === 'ai-draft' && fittingTemplate) {
    return (
      <div className="flex flex-col h-full p-6 md:p-8 max-w-4xl mx-auto">
        <header className="mb-6 flex items-center gap-3 mt-2 md:mt-0">
          <button onClick={handleBack} className="text-[#64748B] hover:text-[#0F172A] p-2 -ml-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-[#0F172A] truncate">Customize with AI</h1>
        </header>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col gap-5 flex-1">
          <div className="flex items-center gap-3 mb-2 border-b border-[#E2E8F0] pb-4">
             <div className="w-10 h-10 rounded-xl bg-[#E0E7FF] flex items-center justify-center text-[#4F46E5]">
               <Sparkles size={20} />
             </div>
             <div>
               <h3 className="font-semibold text-[#0F172A]">{fittingTemplate.name}</h3>
               <p className="text-sm text-[#64748B]">Provide details to fill in the template</p>
             </div>
          </div>

          {/* Toggle Modes */}
          <div className="flex gap-2 p-1 bg-[#F1F5F9] rounded-xl self-start">
            <button onClick={() => setFitSourceMode('paste')} className={px-4 py-2 text-sm font-semibold rounded-lg transition-colors }>Type / Paste</button>
            <button onClick={() => { setFitSourceMode('history'); fetchHistory(); }} className={px-4 py-2 text-sm font-semibold rounded-lg transition-colors }>From History</button>
          </div>

          {fitSourceMode === 'paste' ? (
            <textarea
              placeholder="e.g. Landlord is John Doe, Tenant is Jane Smith, Rent is  per month..."
              value={fittingInput}
              onChange={e => setFittingInput(e.target.value)}
              className="flex-1 w-full border border-[#E2E8F0] rounded-xl p-4 text-sm bg-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] resize-none"
            />
          ) : (
            <div className="flex-1 overflow-y-auto border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] divide-y divide-[#E2E8F0]">
              {historyItems.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] text-sm">No text history available to extract details from.</div>
              ) : (
                historyItems.map(h => (
                  <button key={h.id} onClick={() => setFittingInput(Extract details from this document transcript: \n\n)} className={w-full text-left p-4 hover:bg-white transition-colors }>
                    <h4 className="font-semibold text-sm text-[#0F172A] mb-1">{h.title}</h4>
                    <p className="text-xs text-[#94A3B8] line-clamp-2">{h.preview}</p>
                  </button>
                ))
              )}
            </div>
          )}

          <button onClick={handleAiFit} disabled={isFitting || !fittingInput.trim()} className="w-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 mt-auto transition-colors shadow-sm shadow-[#4F46E5]/20">
            {isFitting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isFitting ? 'Generating Draft...' : 'Generate Draft'}
          </button>
        </div>
      </div>
    );
  }

  // ── Template list view ──
  if (view === 'list' && activeCategory) {
    return (
      <div className="flex flex-col h-full p-6 md:p-8 max-w-4xl mx-auto">
        <header className="mb-6 flex items-center gap-3 mt-2 md:mt-0">
          <button onClick={handleBack} className="text-[#64748B] hover:text-[#0F172A] p-2 -ml-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
            ← Templates
          </button>
          <h1 className="text-xl font-bold text-[#0F172A] truncate">
            {activeCategory.icon} {activeCategory.name}
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCategory.templates.map(template => (
            <div key={template.id} className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                   <FileText className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <p className="font-semibold text-[#0F172A]">{template.name}</p>
              </div>
              
              <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0]">
                <button onClick={() => { setFittingTemplate(template); setView('ai-draft'); }} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#E0E7FF] text-[#4F46E5] font-semibold text-xs hover:bg-[#C7D2FE] transition-colors">
                  <Sparkles size={14} /> AI Fill
                </button>
                <button onClick={() => handleSelectTemplate(template)} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#F1F5F9] text-[#64748B] font-semibold text-xs hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors">
                  <PenTool size={14} /> Blank
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Category list / search view ──
  return (
    <div className="flex flex-col h-full p-6 md:p-8 max-w-4xl mx-auto">
      <header className="mb-6 mt-2 md:mt-0">
        <h1 className="text-2xl font-bold font-display tracking-tight text-[#0F172A] mb-1">Templates</h1>
        <p className="text-[#64748B] text-sm">Standard legal document templates.</p>
      </header>

      {/* Search */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#94A3B8]" />
        </div>
        <input
          type="search"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] shadow-sm transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-[#0F172A]">
             <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searchQuery ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
          {allTemplates.length === 0 ? (
            <p className="text-[#64748B] text-sm col-span-2 text-center py-10">No templates found.</p>
          ) : (
            allTemplates.map(template => (
              <div key={template.id} className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                     <FileText className="w-5 h-5 text-[#4F46E5]" />
                  </div>
                  <div>
                     <p className="font-semibold text-[#0F172A] text-sm">{template.name}</p>
                     <p className="text-xs text-[#64748B]">{template.categoryName}</p>
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0]">
                  <button onClick={() => { setFittingTemplate(template); setView('ai-draft'); }} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#E0E7FF] text-[#4F46E5] font-semibold text-xs hover:bg-[#C7D2FE] transition-colors">
                    <Sparkles size={14} /> AI Fill
                  </button>
                  <button onClick={() => handleSelectTemplate(template)} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#F1F5F9] text-[#64748B] font-semibold text-xs hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors">
                    <PenTool size={14} /> Blank
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
          {TEMPLATE_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => handleSelectCategory(category)}
              className="flex items-center justify-between p-5 rounded-2xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-all shadow-sm active:scale-95 group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0 group-hover:bg-[#E0E7FF] transition-colors">
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A]">{category.name}</h3>
                  <p className="text-sm text-[#64748B] mt-0.5">{category.templates.length} templates</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:text-[#4F46E5] transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
