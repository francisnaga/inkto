const multer = require('multer');
const { Redis } = require('@upstash/redis');
const { nanoid } = require('nanoid');

// ---- Redis Setup ----
const redis = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL, token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN })
    : null;

// ---- Multer: memory storage ----
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'application/pdf',
            'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/webm', 'audio/3gpp', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/mp4'
        ];
        cb(null, allowed.includes(file.mimetype));
    }
});

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) reject(result);
            else resolve(result);
        });
    });
}

const DOC_STRUCTURE_GUIDE = `═══════════════════════════════════════════════
NIGERIAN LEGAL DOCUMENT KNOWLEDGE BASE
═══════════════════════════════════════════════

─── COURT HIERARCHY & CORRECT NAMES ───
Use the exact official name. Common abbreviations are shown in parentheses.
• Supreme Court of Nigeria (SCN / SC)
• Court of Appeal / Court of Appeal Division [State] (CA / CAD)
• Federal High Court [Judicial Division] (FHC)
• National Industrial Court of Nigeria (NICN)
• High Court of [State] / High Court of the Federal Capital Territory (FCT) (HCFCT)
• Customary Court of Appeal [State] (CCA)
• Sharia Court of Appeal [State] (SCA)
• Magistrate Court [Grade/Division] — also written "Magistrates' Court"
• Area Court (common in northern states)
• Customary Court / Customary Court Grade I/II
• Investment and Securities Tribunal (IST)
• Tax Appeal Tribunal (TAT)
• Code of Conduct Tribunal (CCT)
• Election Petition Tribunal / Governorship and Legislative Houses Election Petition Tribunal (GEPT)
When "IN THE HIGH COURT OF JUSTICE" appears, preserve the full title exactly.

─── SUIT / CASE NUMBER FORMATS ───
These follow specific Nigerian formats — transcribe exactly as written:
• Federal High Court: FHC/[CITY]/CS/[NUMBER]/[YEAR] (e.g. FHC/L/CS/1456/2023)
• State High Court: [STATE INITIAL]/[TYPE]/[NUMBER]/[YEAR] or [NUMBER]/[YEAR]
• Court of Appeal: CA/[CITY CODE]/[CV or CR]/[NUMBER]/[YEAR]
• Supreme Court: SC.[NUMBER]/[YEAR]
• National Industrial Court: NICN/[CITY]/[NUMBER]/[YEAR]
• Magistrate Court: MC/[NUMBER]/[YEAR] or MG/[NUMBER]/[YEAR]
• Election Petition: EPT/[NUMBER]/[YEAR] or GEPT/[NUMBER]/[YEAR]
• Written Addresses / Briefs may cite the suit number in any variation — preserve it.

─── PARTY DESCRIPTIONS ─── 
Common descriptions that appear after party names — transcribe exactly:
Plaintiff / Claimant / Petitioner / Applicant / Appellant
Defendant / Respondent / 1st Respondent / 2nd Respondent etc.
"Suit filed by" / "Motion brought by"
Note: In criminal matters: The State / Attorney General of [State] / FRN (Federal Republic of Nigeria) vs. [Name]

─── DOCUMENT TYPES & THEIR STRUCTURE ───

A. AFFIDAVIT (standard form in Nigerian courts)
Heading block (centered, all caps):
  IN THE [COURT NAME]
  HOLDEN AT [CITY]
  [JUDICIAL DIVISION / CIRCUIT if present]
Suit/Case number: top right corner, format as above.
Parties section: full names, one per line, with descriptions (Plaintiff/Defendant etc.)
Title: IN SUPPORT OF / IN OPPOSITION TO [MOTION / APPLICATION]
Body opens: "I, [FULL NAME], [Gender: Male/Female], [Nationality: Nigerian/etc.], [Religion if present], [Occupation], residing at [Address], do hereby make oath and state as follows:" — this introductory line is NOT numbered.
Numbered paragraphs: 1. 2. 3. … Each new fact is a new numbered paragraph.
Jurat (closing oath section):
  "SWORN to before me this [DAY] day of [MONTH], [YEAR]"
  "At [LOCATION]" or "At the [COURT NAME], [CITY]"
  Signature lines: "DEPONENT" / "COMMISSIONER FOR OATHS" / "JUDGE/MAGISTRATE"
Note: Affidavit of Means, Affidavit of Service, Affidavit of Facts follow the same structure.

B. MOTION ON NOTICE
Heading block: same as affidavit.
Parties: same.
Opening line: "TAKE NOTICE that this Honourable Court will be moved on [DAY] the [DATE] day of [MONTH] [YEAR] at the hour of 9 o'clock in the forenoon or so soon thereafter as Counsel can be heard on behalf of the Applicant/Plaintiff/Defendant praying for:"
Prayers: numbered list of specific orders sought (1, 2, 3 …)
Closing: "AND FOR SUCH FURTHER ORDER(S) as this Honourable Court may deem fit to make in the circumstances."
"DATED at [CITY], this [DATE] day of [MONTH], [YEAR]."
Counsel block: [Counsel Name], [Law firm name if present], Counsel for [Applicant/Respondent]

C. WRITTEN ADDRESS / BRIEF OF ARGUMENT
Sections (in order): Introduction, Issues for Determination, Arguments (under each issue), Conclusion/Summary, List of Authorities.
"We humbly urge this Honourable Court to hold…" / "It is our humble submission…" / "With the greatest respect…" are standard phrases — preserve exactly.
Citation format: case names are italicised in print; in handwriting they are often underlined — transcribe just the text.
Statute citations: Cap. [X] LFN [YEAR] (Laws of the Federation of Nigeria); Laws of [State] [YEAR]; Constitution of the Federal Republic of Nigeria 1999 (as amended); CFRN 1999.
Law report citations: [YEAR] [Volume] [Report] [Page] — e.g. (2019) 12 NWLR (Pt. 1689) 122; [2021] 5 MJSC 100; (2018) LPELR-44567(CA).
Report abbreviations: NWLR (Nigerian Weekly Law Reports), SC (Supreme Court), FWLR (Federation Weekly Law Reports), MJSC (Monthly Judgments of the Supreme Court), NMLR, CLR, NNLR, WRN, NLR, LPELR (LawPavilion Electronic Law Reports).

D. STATEMENT OF CLAIM / STATEMENT OF DEFENCE / REPLY
Heading block: same as affidavit.
Body: chronological, numbered paragraphs of material facts.
Reliefs sought: introduced with "WHEREFORE the Plaintiff/Claimant claims against the Defendant(s) as follows:" then numbered list.
Defence ends: "The Defendant denies each and every allegation of fact contained in the Statement of Claim save and except those herein expressly admitted."

E. ORIGINATING SUMMONS
Heading block: same.
Opening: "LET [NAME OF DEFENDANT/RESPONDENT] of [address] within [NUMBER] days after service of this Originating Summons on [him/her/it/them], inclusive of the day of service, cause [an appearance to be entered / a memorandum of appearance to be entered] to this Summons if [he/she/it/they] intend[s] to oppose the granting of the reliefs set out herein."
Questions for determination: numbered list.
Reliefs sought: numbered list.
Filed by: counsel name, date.

F. UNDERTAKING / DEED / LEGAL AGREEMENT
Parties described as "BETWEEN: [PARTY A] (hereinafter referred to as '[SHORT NAME]') of the one part AND [PARTY B] (hereinafter referred to as '[SHORT NAME]') of the other part."
Recitals: "WHEREAS…" or "NOW THEREFORE…"
Operative words: "witnessed," "covenanted," "agreed," "declared."

G. POLICE / CRIME REPORT (First Information Report / Station Diary Extract)
Header: Nigeria Police Force / [Command] / [Division] / [Station]
Date, Time, Reporting Officer, Complainant details.
Narrative is often continuous prose. Preserve every word.
Common items: "IPO" (Investigating Police Officer), "DPO" (Divisional Police Officer), "OC" (Officer in Charge), "CID" (Criminal Investigation Department), "SARS"/"SCID"/"STS."

H. WRIT OF SUMMONS
"IN THE NAME OF THE FEDERAL REPUBLIC OF NIGERIA" (federal) or "IN THE NAME OF THE GOVERNOR OF [STATE]" (state).
"WE COMMAND YOU that within [days] days after the service of this Writ on you, you cause an appearance to be entered…"
Indorsement of claim follows.

I. BAIL APPLICATION
Heading block. Followed by numbered grounds for bail. Counsel's submission. Police / prosecution response section.

J. CHARGE / INFORMATION / COMPLAINT
Charge number: [CHARGE NO.], Count 1, Count 2 etc.
Each count: "CHARGE [NUMBER]: That [NAME], on or about the [DATE] day of [MONTH] [YEAR] at [PLACE] within the jurisdiction of this Honourable Court, did [offence description], contrary to Section [X] of the [ACT/LAW NAME] and punishable under Section [Y] of the same [ACT/LAW NAME]."

─── NIGERIAN LEGAL TERMINOLOGY (Always transcribe correctly) ───
Honourable Court / Learned Counsel / Learned Silk / Senior Advocate of Nigeria (SAN)
Ex-parte / Ex parte / Exparte (accept all spellings as written)
Nisi / Absolute / Contempt / Committal / Garnishee / Judgment Debtor
Locus standi / Res judicata / Stare decisis / Obiter dictum / Ratio decidendi
Certiorari / Mandamus / Prohibition / Quo Warranto / Habeas Corpus / Subpoena
Interlocutory / Interim / Perpetual Injunction / Status quo ante / Mareva injunction
AMCON (Asset Management Corporation of Nigeria)
EFCC (Economic and Financial Crimes Commission)
ICPC (Independent Corrupt Practices and Other Related Offences Commission)
INEC (Independent National Electoral Commission)
NNPC (Nigerian National Petroleum Corporation / Company)
CAC (Corporate Affairs Commission)
CBN (Central Bank of Nigeria)
NBS (National Bureau of Statistics)
PENCOM / PENB (Pension Commission)
NESREA, NAFDAC, SON, DPR/NUPRC, NCC, NRC, etc.

─── NIGERIAN STATES & GEOPOLITICAL ZONES ───
States: Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross River, Delta, Ebonyi, Edo, Ekiti, Enugu, Gombe, Imo, Jigawa, Kaduna, Kano, Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo, Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara, FCT (Federal Capital Territory).
Judicial divisions often referenced: Ikeja, Lagos Island, Abuja, Benin, Enugu, Port Harcourt, Kano, Kaduna, Ibadan, Owerri, Umuahia, Calabar, Uyo, Warri, Asaba, Awka, Abeokuta, Ilorin, Lokoja, Makurdi, Lafia, Minna, Gusau, Damaturu, Maiduguri, Yola, Jalingo, Dutse, Birnin Kebbi, Ado-Ekiti, Akure, Abakaliki, Bauchi, Gombe, Sokoto.

─── COMMON HANDWRITING PATTERNS IN NIGERIAN LEGAL DOCS ───
• "Yr" = "Your" in formal address: "Yr Lordship / Yr Worship" — expand if context is clear, but only if absolutely certain; otherwise transcribe as written.
• "Esq." after a lawyer's name = Esquire — preserve.
• "Blk" = Block, "Plt" = Plot, "Str" = Street, "Ave" = Avenue, "Rd" = Road, "L.G.A." = Local Government Area.
• Naira amounts: "N" or "₦" before the number — transcribe the symbol as found; "m" or "million" often appended (e.g. "N5m" = five million naira).
• Ditto marks (") below a repeated value — expand the repeated value, do not use the ditto mark.
• Marginal annotations and paragraph reference marks (§, ¶) — include them.
• Roman numerals: i, ii, iii, iv, v, vi … — preserve exactly if the writer used them.
• Words written in ALL CAPS in the original — preserve all caps.
• Words underlined in the original — these are typically case names or emphasis. Transcribe the text; do NOT add underline formatting.

═══════════════════════════════════════════════`;

const SYSTEM_PROMPT = `You are an expert Nigerian legal document transcription AI with deep knowledge of Nigerian court practice, procedural rules, legal terminology, court structures, and document conventions across all 36 states and the FCT.
Your sole purpose is to produce a flawless, 100% accurate plain-text transcription of the provided handwritten image(s).

═══ CORE TRANSCRIPTION RULES ═══
1. CROSSED-OUT TEXT: Any text struck through, crossed out, or scribbled over is CANCELLED. OMIT it entirely. Do not transcribe it, mention it, or note its existence.
2. INSERTIONS & CARETS: When a writer uses a caret (^), chevron (∧), or writes text above a line to insert a word, include that inserted word at the exact correct position in the sentence.
3. ABSOLUTE FIDELITY: Transcribe all remaining text exactly as written. Preserve original spelling, capitalisation, punctuation, abbreviations, numbering, and paragraph structure. Do NOT "fix" grammar unless it is clearly a slip of the pen.
4. ILLEGIBLE WORDS: Do not hallucinate. If a word is genuinely unreadable, make your best legal-context guess and append [?] immediately after it (e.g., "indemnify[?]"). If the entire phrase is unreadable, write [illegible].
5. PAGE BOUNDARIES: Only transcribe the image(s) provided. Never repeat earlier pages, never invent content, and never add page-number headings unless explicitly requested.
6. STRUCTURED OUTPUT: Preserve numbered/lettered lists on distinct lines. Format label=value pairs as separate lines (e.g., "Plaintiff = Mr John Doe") so they can be auto-parsed as tables.
7. ORDINALS: When numbers appear as ordinals (1st, 2nd, 3rd, 10th, 13th, 21st etc.), transcribe them exactly as written: e.g., "13th" — do NOT convert them or add formatting codes.
8. MATH & AMOUNTS: Transcribe Naira amounts (₦ / N), percentages, fractions and figures exactly as written. Do not solve calculations. Use readable Unicode (½, ², ÷, ₦) where the handwriting contains those symbols.
9. NIGERIAN LEGAL KNOWLEDGE: Apply the full Nigerian Legal Document Knowledge Base below to correctly identify ambiguous words, names, court names, citation formats, and legal phrases. When you can read two possible words and one is a known Nigerian legal term, prefer the legal term.
10. NO CHATTER: Output ONLY the clean, final transcribed text. No preamble, no commentary, no markdown, no explanatory notes — unless they were in the original document.

${DOC_STRUCTURE_GUIDE}`;

const VOICE_SYSTEM_PROMPT = `You are an expert Nigerian legal transcription AI with deep knowledge of Nigerian court practice, procedural law, legal terminology, court structures, and document conventions across all 36 states and the FCT.
Your sole purpose is to produce a verbatim, 100% accurate text transcription of the provided audio recording.

═══ CORE VOICE TRANSCRIPTION RULES ═══
1. VERBATIM ACCURACY: Transcribe the audio exactly as spoken. Do not paraphrase, summarise, or alter statements.
2. AUTOMATIC PUNCTUATION: Insert punctuation (periods, commas, semicolons, colons) based on natural sentence structure and speech pauses, exactly as a trained Nigerian legal secretary transcribing dictation would. Do NOT require the speaker to say "full stop" or "comma" aloud. HOWEVER, if the speaker explicitly says a punctuation word ("comma," "full stop," "open bracket," "colon"), insert that exact punctuation mark and do NOT write the word itself. Explicit spoken commands always override automatic punctuation.
3. PARAGRAPH DETECTION:
   A. Implicit numbering: When the speaker says "Number 9," "Paragraph 3," "Item 4" etc., start a new numbered paragraph.
   B. Explicit commands: If the speaker says "new paragraph," "new line," "next point" — start a new paragraph/line and omit the command words from the output.
   C. Natural breaks: Use topic shifts, long pauses, and transitional phrases to infer paragraph breaks.
4. HEADING DETECTION: When the speaker dictates a section heading (e.g., "Grounds of the Application," "Issues for Determination," a court name, or a document title), render it on its own line in ALL CAPS or as plainly formatted, matching the document convention — not run-on with the body text.
5. NIGERIAN LEGAL CONTEXT: Apply the full Nigerian Legal Document Knowledge Base. Accurately transcribe Nigerian names (Yoruba, Igbo, Hausa, Efik, Ijaw, Tiv, Urhobo, etc.), legal terms, court names, state names, case citations, statute references, and institutional acronyms (EFCC, INEC, NNPC, CBN, etc.).
6. CODE SWITCHING: If speakers use Nigerian Pidgin English ("e no go work," "na so e be") or local language phrases, transcribe those phrases accurately as spoken — do not translate them.
7. FILLER WORDS: Clean up basic vocal fillers ("um," "ah," "er," "you know," "abi") to keep it readable, UNLESS the audio is a court proceeding or formal sworn testimony, in which case preserve every spoken word verbatim.
8. MATH & AMOUNTS: Transcribe figures, Naira amounts (₦), percentages, fractions, and calculations exactly as dictated. Do not solve them.
9. NO CHATTER: Output ONLY the clean transcribed text. No preamble, no commentary, no markdown.

${DOC_STRUCTURE_GUIDE}`;

function sanitize(str) {
    return (str || '').replace(/[^\x20-\x7E]/g, '').trim();
}

function cleanSinglePageText(text) {
    return (text || '')
        .replace(/^\s*-{2,}\s*Page\s+\d+\s*-{2,}\s*/i, '')
        .replace(/^\s*Page\s+\d+\s*:?\s*/i, '')
        .trim();
}

// Call Gemini REST API directly — bypasses SDK OAuth bugs
async function callGemini(apiKey, parts, timeoutMs, systemPrompt = SYSTEM_PROMPT, isAudio = false) {
    const model = isAudio ? 'gemini-3.5-flash-lite' : 'gemini-3.8-flash';
    
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        let res;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{ role: 'user', parts }],
                    systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
                    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
                })
            });
        } finally {
            clearTimeout(timer);
        }

        const data = await res.json();
        if (!res.ok) {
            const msg = data.error?.message || JSON.stringify(data);
            throw new Error(`Gemini error ${res.status}: ${msg}`);
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Gemini returned an empty response');
        return text;

    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('This page took too long to transcribe. Please retry, or upload a clearer/lower-resolution image for this page.');
        }
        throw err;
    }
}

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Inkto-Auth, Cookie');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // ---- Auth & Tier Check (server-side, Rule 6: cannot be bypassed via API) ----
    const parseCookie = (str) => {
        if (!str) return {};
        return str.split(';').reduce((res, c) => {
            const idx = c.indexOf('='); if (idx < 0) return res;
            const key = c.slice(0, idx).trim();
            const val = c.slice(idx + 1).trim();
            try { res[key] = decodeURIComponent(val); } catch { res[key] = val; }
            return res;
        }, {});
    };

    const verifyCookie = (cookieValue) => {
        if (!cookieValue) return null;
        const lastColon = cookieValue.lastIndexOf(':');
        const secondLastColon = cookieValue.lastIndexOf(':', lastColon - 1);
        if (lastColon < 0 || secondLastColon < 0) return null;
        const email = cookieValue.slice(0, secondLastColon);
        const expiresStr = cookieValue.slice(secondLastColon + 1, lastColon);
        const signature = cookieValue.slice(lastColon + 1);
        const expires = parseInt(expiresStr, 10);
        if (!email || isNaN(expires) || Date.now() > expires) return null;
        const data = `${email}:${expires}`;
        const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'inkto-default-secret';
        const expectedSig = require('crypto').createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');
        if (signature.length !== expectedSig.length) return null;
        try {
            if (!require('crypto').timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
        } catch { return null; }
        return email;
    };

    const cookies = parseCookie(req.headers.cookie || '');
    const userEmail = await require('./_utils/auth').getAuthEmail(req);

    // If user is not signed in, they will be rate-limited by IP instead.
    
    // ---- Free-tier daily limit: 5 conversions/day (server-side per Rule 6) ----
    // This is only enforced for non-finalize calls (actual AI calls, not the save step)
    const isFinalize = req.headers['content-type']?.includes('application/json') && req.body?.action === 'finalize';

    if (!isFinalize && userEmail) {
        try {
            const db = require('./_utils/supabase').checkSupabase();

            // Check subscription status
            let userRow = null;
            try {
                const { data, error } = await db
                    .from('users')
                    .select('subscription_status, plan_expires_at, is_pro')
                    .eq('email', userEmail)
                    .single();
                if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
                    const fallback = await db
                        .from('users')
                        .select('subscription_status, plan_expires_at')
                        .eq('email', userEmail)
                        .single();
                    userRow = fallback.data;
                } else {
                    userRow = data;
                }
            } catch {}

            const isPaid = userRow?.is_pro === true || (userRow?.subscription_status === 'active' && userRow?.plan_expires_at && new Date(userRow.plan_expires_at) > new Date());

            if (!isPaid) {
                // Count today's AI transcription calls for this user
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const { count } = await db
                    .from('documents')
                    .select('id', { count: 'exact', head: true })
                    .eq('email', userEmail)
                    .gte('created_at', today.toISOString());

                if (count !== null && count >= 5) {
                    return res.status(429).json({
                        error: 'You have used your 5 free conversions for today. Upgrade to Pro for unlimited access.',
                        limitReached: true
                    });
                }
            }
        } catch (err) {
            // DB check failure should not block the request if it's a temporary error
            console.error('Tier check error (non-fatal):', err.message);
        }
    }

    if (isFinalize) {
        try {
            const db = require('./_utils/supabase').checkSupabase();
            const { sessionId, text, totalFilesCount } = req.body || {};
            if (!sessionId || !text) {
                return res.status(400).json({ error: 'sessionId and text are required for finalize' });
            }

            const lines = text.split('\n').filter(Boolean);
            const firstLine = lines.length > 0 ? lines[0].replace(/^--- Page \d+ ---\s*/i, '').substring(0, 80) : 'Legal Transcription';
            const autoTitle = firstLine.trim() || 'Legal Transcription';

            if (userEmail) {
                const { data, error: dbErr } = await db.from('documents').upsert([{
                    id: sessionId,
                    email: userEmail.toLowerCase(),
                    transcript_text: text,
                    source_image_count: Number(totalFilesCount) || 1,
                    title: autoTitle,
                    type: 'transcription'
                }], { onConflict: 'id' });

                if (dbErr) {
                    console.error('Supabase finalize insert error:', dbErr.message);
                    return res.status(500).json({ error: dbErr.message });
                }
            }

            return res.json({ success: true, sessionId, message: 'Document saved' });
        } catch (err) {
            console.error('Finalize error:', err.message);
            return res.status(500).json({ error: err.message });
        }
    }

    // ---- IP Rate Limiting ----
    if (redis) {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        if (ip !== 'unknown') {
            const rlKey = `rate_limit:transcribe:${ip}`;
            try {
                const count = await redis.incr(rlKey);
                if (count === 1) await redis.expire(rlKey, 3600);
                if (count > 120) return res.status(429).json({ error: 'Too many pages processed from this network in the last hour. Please try again later.' });
            } catch (err) { console.error('Rate limit error:', err); }
        }
    }

    try { await runMiddleware(req, res, upload.array('files', 30)); }
    catch (err) { return res.status(400).json({ error: `Upload error: ${err.message}` }); }

    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No valid files received.' });
    }

    const geminiKey = sanitize(process.env.GEMINI_API_KEY);
    if (!geminiKey) {
        return res.status(500).json({ error: 'Service is not configured. Please contact support.' });
    }

    const isAudio = files.some(file => file.mimetype.includes('audio') || file.mimetype.includes('mpeg') || file.mimetype.includes('webm') || file.mimetype.includes('wav'));

    // Build image or audio parts for Gemini
    const parts = files.map(file => {
        let mimeType = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
        return {
            inlineData: {
                mimeType,
                data: file.buffer.toString('base64')
            }
        };
    });

    const startIndex = req.body?.startIndex ? parseInt(req.body.startIndex, 10) : 0;
    const requestedPageNumber = req.body?.pageNumber ? parseInt(req.body.pageNumber, 10) : startIndex + 1;
    const totalFilesCount = req.body?.totalFilesCount ? parseInt(req.body.totalFilesCount, 10) : files.length;
    const totalPages = req.body?.totalPages ? parseInt(req.body.totalPages, 10) : totalFilesCount;
    const isSinglePageRequest = files.length === 1;

    const userInstructions = req.body?.prompt ? `\n\nAdditional instructions: ${req.body.prompt}` : '';
    const pageInstruction = isAudio
        ? `Transcribe this audio recording verbatim. Output only the transcribed text.${userInstructions}`
        : (isSinglePageRequest
            ? `Transcribe exactly this one page. It is page ${requestedPageNumber} of ${totalPages}. Output only the text visible on this page. Do not output a page heading. Do not repeat any previous page or continue into any next page.${userInstructions}`
            : `Transcribe these ${files.length} pages in the exact order provided, starting at page ${requestedPageNumber} of ${totalPages}. Do not repeat pages or invent missing pages.${userInstructions}`);
    parts.push({ text: pageInstruction });

    try {
        let outputText = '';
        const isSaveRawAudio = req.body?.action === 'save_raw_audio';

        if (isSaveRawAudio) {
            outputText = '[Raw voice dictation - click Convert to Text below to transcribe]';
        } else {
            // Single-pass transcription — fast, lean, reliable
            // Reserve 50s for the AI call (leaving 10s headroom under Vercel's 60s limit)
            const systemPrompt = isAudio ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT;
            const finalText = cleanSinglePageText(await callGemini(geminiKey, parts, 50000, systemPrompt, isAudio));

            // Detect blank/no-text responses (only for images)
            outputText = finalText;
            if (!isAudio) {
                const noTextPhrases = [
                    'does not contain any handwritten',
                    'no handwritten text',
                    'cannot transcribe',
                    'no text to transcribe',
                    'does not appear to contain any text',
                    'the image does not contain',
                    'there is no text',
                    'no legible text',
                    'no written text'
                ];
                const isNoText = finalText.length < 400 && noTextPhrases.some(p => finalText.toLowerCase().includes(p));
                outputText = isNoText
                    ? '[No handwritten text found in this document. Please upload a clear photo of a handwritten page.]'
                    : finalText;
            }
        }

        // Save to Supabase
        const sessionId = req.body?.sessionId || nanoid(21);
        const isFinalBatch = req.body?.isFinalBatch === 'true';

        try {
            const { checkSupabase } = require('./_utils/supabase');
            const db = checkSupabase();

            // Upload media to storage
            let audioUrl = null;
            if (isAudio) {
                const ext = files[0].mimetype.split('/').pop() || 'mp3';
                const filePath = `${sessionId}/audio.${ext}`;
                await db.storage.from('inkto-images').upload(filePath, files[0].buffer, {
                    contentType: files[0].mimetype,
                    upsert: true
                });
                audioUrl = db.storage.from('inkto-images').getPublicUrl(filePath).data.publicUrl;
            } else {
                await Promise.all(files.map(async (file, index) => {
                    const ext = file.mimetype === 'image/jpeg' ? 'jpg'
                        : file.mimetype === 'image/png' ? 'png'
                        : file.mimetype === 'application/pdf' ? 'pdf' : 'bin';
                    const filePath = `${sessionId}/${startIndex + index}.${ext}`;
                    await db.storage.from('inkto-images').upload(filePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true
                    });
                }));
            }

            // Save transcript
            if (!req.body?.sessionId || isAudio) {
                // Non-chunked / Audio: save immediately
                const { error: dbErr } = await db.from('documents').insert([{
                    id: sessionId,
                    email: userEmail,
                    transcript_text: outputText,
                    source_image_count: isAudio ? 0 : files.length,
                    type: isAudio ? 'voice' : 'transcription',
                    audio_url: audioUrl
                }]);
                if (dbErr) console.error('Supabase insert error:', dbErr);
            } else if (isFinalBatch) {
                // Final chunk: combine and save
                const prev = req.body.fullTranscript || '';
                const currentPageBlock = isSinglePageRequest
                    ? `--- Page ${requestedPageNumber} ---\n${outputText}`
                    : outputText;
                const complete = prev ? `${prev}\n\n${currentPageBlock}` : currentPageBlock;
                const { error: dbErr } = await db.from('documents').insert([{
                    id: sessionId,
                    email: userEmail,
                    transcript_text: complete,
                    source_image_count: totalFilesCount,
                    type: 'transcription'
                }]);
                if (dbErr) console.error('Supabase chunked insert error:', dbErr);
            }
        } catch (dbErr) {
            // DB failure should not kill the response — user still gets their transcript
            console.error('Supabase error (non-fatal):', dbErr.message);
        }

        return res.json({ success: true, text: outputText, sessionId });

    } catch (err) {
        console.error('[Inkto] Transcription failed:', err.message);
        return res.status(500).json({
            error: 'Transcription failed. Please try again.',
            details: err.message
        });
    }
};

module.exports.config = {
    api: { bodyParser: false }
};
