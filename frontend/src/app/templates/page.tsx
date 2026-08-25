'use client';

import { useState } from 'react';
import { ChevronRight, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ── Template data ──────────────────────────────────────────────────────────
const TEMPLATE_CATEGORIES = [
  {
    id: 'affidavits',
    name: 'Affidavits',
    icon: '📜',
    templates: [
      { 
        id: 'general-affidavit', 
        name: 'General Affidavit',
        content: `IN THE HIGH COURT OF [STATE] STATE
IN THE [JUDICIAL DIVISION] JUDICIAL DIVISION
HOLDEN AT [CITY]

AFFIDAVIT OF [PURPOSE]

I, [FULL NAME], [Adult/Citizen], [Occupation], of [Address], [Religion] do hereby make oath and state as follows:

1. That I am the Deponent herein.
2. That I am a citizen of Nigeria.
3. [Insert facts here...]
4. That I make this solemn declaration conscientiously believing same to be true and in accordance with the Oaths Act.

_______________________
DEPONENT

SWORN to at the Registry of the High Court of [State], this [Day] day of [Month], [Year].

BEFORE ME,

_______________________
COMMISSIONER FOR OATHS`
      },
      { 
        id: 'affidavit-of-loss', 
        name: 'Affidavit of Loss',
        content: `IN THE HIGH COURT OF [STATE] STATE
IN THE [JUDICIAL DIVISION] JUDICIAL DIVISION
HOLDEN AT [CITY]

AFFIDAVIT OF LOSS OF [ITEM]

I, [FULL NAME], [Adult/Citizen], [Occupation], of [Address], [Religion] do hereby make oath and state as follows:

1. That I am the Deponent herein.
2. That I am the lawful owner of [describe item, e.g., SIM card, ID card, document] with [serial number/identification details].
3. That on the [Date], I discovered that the said [Item] was missing/lost.
4. That despite all diligent search and efforts, I have been unable to find it.
5. That this Affidavit is required for [state purpose, e.g., record purposes, replacement].
6. That I make this solemn declaration conscientiously believing same to be true and in accordance with the Oaths Act.

_______________________
DEPONENT

SWORN to at the Registry of the High Court of [State], this [Day] day of [Month], [Year].

BEFORE ME,

_______________________
COMMISSIONER FOR OATHS`
      },
    ],
  },
  {
    id: 'agreements',
    name: 'Agreements',
    icon: '🤝',
    templates: [
      { 
        id: 'tenancy-agreement', 
        name: 'Tenancy Agreement',
        content: `TENANCY AGREEMENT

THIS AGREEMENT is made this [Day] day of [Month], [Year] 
BETWEEN [LANDLORD'S NAME] of [Address] (hereinafter called the "Landlord") of the one part 
AND [TENANT'S NAME] of [Address] (hereinafter called the "Tenant") of the other part.

WHEREBY IT IS AGREED as follows:
1. The Landlord lets and the Tenant takes the property situated at [Property Address] for a term of [Term, e.g., 1 year] commencing on the [Start Date] at the rent of N[Amount] per annum payable in advance.
2. The Tenant covenants with the Landlord:
   a. To pay the rent at the times and in the manner aforesaid.
   b. To keep the premises in good and tenantable repair.
   c. Not to assign or sublet the premises without the Landlord's written consent.
3. The Landlord covenants with the Tenant for quiet enjoyment of the premises.

IN WITNESS WHEREOF the parties have hereunto set their hands and seals the day and year first above written.

SIGNED, SEALED AND DELIVERED by the Landlord
_______________________

SIGNED, SEALED AND DELIVERED by the Tenant
_______________________`
      },
    ],
  },
  {
    id: 'letters',
    name: 'Legal Letters',
    icon: '✉️',
    templates: [
      { 
        id: 'letter-of-demand', 
        name: 'Letter of Demand',
        content: `[LAW FIRM LETTERHEAD]
[Date]

[Recipient Name]
[Recipient Address]

Dear Sir/Madam,

RE: LETTER OF DEMAND FOR [SUBJECT MATTER/AMOUNT]

We act as Solicitors to [Client Name] (hereinafter referred to as "our Client") on whose instructions we write you.

Our Client informs us that [state the facts of the debt or obligation]. 

TAKE NOTICE that we hereby demand the payment of the sum of N[Amount] within [Number] days of the receipt of this letter.

IF YOU FAIL, REFUSE OR NEGLECT to comply with this demand, we have our Client's instructions to commence legal proceedings against you without further recourse to you.

Yours faithfully,

_______________________
[Lawyer's Name]
[Law Firm Name]`
      },
    ],
  },
];

type View = 'categories' | 'list' | 'editor';

interface Template {
  id: string;
  name: string;
  content?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  templates: Template[];
}

export default function TemplatesPage() {
  const [view, setView] = useState<View>('categories');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorContent, setEditorContent] = useState('');

  const handleCategorySelect = (cat: Category) => {
    setActiveCategory(cat);
    setView('list');
  };

  const handleUseBlank = (template: Template) => {
    setActiveTemplate(template);
    setEditorContent(template.content || `[Content for ${template.name}]`);
    setView('editor');
  };

  const handleBack = () => {
    if (view === 'editor') { setView('list'); setActiveTemplate(null); setEditorContent(''); }
    else if (view === 'list') { setView('categories'); setActiveCategory(null); }
  };

  // Search across all templates
  const searchResults = searchQuery.trim().length > 1
    ? TEMPLATE_CATEGORIES.flatMap(cat =>
        cat.templates
          .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(t => ({ ...t, categoryName: cat.name, category: cat }))
      )
    : [];

  // ── Editor view ──
  if (view === 'editor' && activeTemplate) {
    return (
      <div className="flex flex-col h-full pt-8 pb-4">
        <header className="mb-5 flex items-center gap-3">
          <button onClick={handleBack} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Back
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-base font-semibold truncate">{activeTemplate.name}</h1>
        </header>

        {/* Disclaimer per spec Rule 4 and compliance addendum Section 2 */}
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
          ⚠ Review all content before use. Inkto is a document tool, not a law firm, and does not provide legal advice.
        </div>

        <textarea
          value={editorContent}
          onChange={e => setEditorContent(e.target.value)}
          className="flex-1 w-full p-4 text-sm font-mono border rounded-xl resize-none bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Template content will appear here..."
        />

        <div className="mt-4 flex gap-3">
          <Button
            className="flex-1 h-12"
            onClick={() => {
              const blob = new Blob([editorContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${activeTemplate.name}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Save as Text
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => {
              navigator.clipboard.writeText(editorContent).catch(() => {});
            }}
          >
            Copy
          </Button>
        </div>
      </div>
    );
  }

  // ── Template list view ──
  if (view === 'list' && activeCategory) {
    return (
      <div className="flex flex-col h-full pt-8 pb-4">
        <header className="mb-6">
          <button onClick={handleBack} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Templates
          </button>
          <h1 className="text-2xl font-bold tracking-tight mt-3">
            {activeCategory.icon} {activeCategory.name}
          </h1>
        </header>

        <div className="space-y-3">
          {activeCategory.templates.map(template => (
            <div
              key={template.id}
              className="p-4 rounded-xl border bg-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-sm font-semibold">{template.name}</p>
              </div>
              {/* Per spec: both actions always visible and equally prominent */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUseBlank(template)}
                >
                  Use Blank
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled
                  title="AI-fit is a Phase 1.5 feature"
                >
                  AI-Fit
                  <span className="ml-1 text-[10px] text-muted-foreground">(soon)</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Category list / search view ──
  return (
    <div className="flex flex-col h-full pt-8 pb-4">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-1 text-sm">Standard legal document templates.</p>
      </header>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search templates…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Search results */}
      {searchQuery.trim().length > 1 ? (
        <div className="space-y-3">
          {searchResults.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No templates match "{searchQuery}".</p>
          ) : (
            searchResults.map(t => (
              <div key={t.id} className="p-4 rounded-xl border bg-card">
                <p className="text-xs text-muted-foreground mb-1">{t.categoryName}</p>
                <p className="text-sm font-semibold mb-3">{t.name}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => { setActiveCategory(t.category); handleUseBlank(t); }}>Use Blank</Button>
                  <Button size="sm" variant="outline" className="flex-1" disabled>AI-Fit <span className="ml-1 text-[10px]">(soon)</span></Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Category grid */
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat)}
              className="p-4 rounded-xl border bg-card text-left hover:bg-muted/40 transition-colors active:scale-[0.98]"
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <p className="text-sm font-semibold leading-tight">{cat.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {cat.templates.length} templates
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
