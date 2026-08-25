const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'inkto-default-secret';
const testEmail = 'test-user@inkto.org';

// Mock Gemini API fetch if no API key is set in local environment
if (!process.env.GEMINI_API_KEY) {
  console.log('ℹ No GEMINI_API_KEY found in local environment. Activating fetch mock for Gemini.');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function(url, options) {
    if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: 'LEGAL AGREEMENT\n\nThis Lease Agreement is made this 25th day of August 2026, between John Doe (Landlord) and Jane Smith (Tenant). The Landlord agrees to lease the property at Lekki Phase 1 to the Tenant for N1,200,000 per annum.'
              }]
            }
          }]
        })
      };
    }
    return originalFetch.apply(this, arguments);
  };
  process.env.GEMINI_API_KEY = 'mocked-key-for-test';
}

// Generate valid auth cookie
function generateAuthCookie(email) {
  const expires = Date.now() + 1000 * 60 * 60 * 24; // 24h
  const data = `${email}:${expires}`;
  const signature = crypto.createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');
  return `inkto_auth=${encodeURIComponent(`${email}:${expires}:${signature}`)}`;
}

async function runTests() {
  console.log('--- STARTING INKTO END-TO-END TEST HARNESS ---');
  
  // 1. Verify Supabase connection & inject test user
  try {
    const { checkSupabase } = require('./backend/_utils/supabase');
    const db = checkSupabase();
    console.log('✓ Connected to Supabase.');

    // Inject user
    const { error: userErr } = await db.from('users').upsert([{
      email: testEmail.toLowerCase(),
      subscription_status: 'active',
      plan_expires_at: new Date(Date.now() + 1000*60*60*24*30).toISOString() // 30 days
    }], { onConflict: 'email' });

    if (userErr) throw userErr;
    console.log(`✓ Test user injected: ${testEmail}`);
  } catch (e) {
    console.error('✗ Database injection failed:', e.message);
    process.exit(1);
  }

  const cookie = generateAuthCookie(testEmail);

  // Helper to mock express req/res
  function mockReqRes(method, body = {}, headers = {}) {
    const req = {
      method,
      body,
      headers: {
        cookie,
        'content-type': 'application/json',
        ...headers
      },
      query: {}
    };
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(name, val) { this.headers[name.toLowerCase()] = val; return this; },
      status(code) { this.statusCode = code; return this; },
      json(data) { this.data = data; this.ended = true; return this; },
      end(data) { this.data = data; this.ended = true; return this; }
    };
    return { req, res };
  }

  // 2. Test user-status endpoint
  console.log('\n--- TESTING /api/user-status ---');
  try {
    const handler = require('./backend/user-status');
    const { req, res } = mockReqRes('GET');
    await handler(req, res);
    if (res.statusCode === 200 && res.data.subscription_status === 'active') {
      console.log('✓ /api/user-status passed.');
    } else {
      throw new Error(`Invalid status: ${res.statusCode} ${JSON.stringify(res.data)}`);
    }
  } catch (e) {
    console.error('✗ /api/user-status failed:', e.message);
    process.exit(1);
  }

  // 3. Test AI Document Drafting (Gemini response validation)
  console.log('\n--- TESTING /api/draft (AI Gemini integration) ---');
  try {
    const handler = require('./backend/draft');
    const { req, res } = mockReqRes('POST', {
      mode: 'draft',
      prompt: 'Draft a simple one-sentence lease agreement between John Doe and Jane Smith.'
    });
    
    console.log('Sending request to Gemini... (waiting for response)');
    await handler(req, res);
    
    if (res.statusCode === 200 && res.data.text) {
      console.log('✓ Gemini AI responded successfully!');
      console.log('--- AI Response preview ---');
      console.log(res.data.text.trim().substring(0, 300));
      console.log('---------------------------');
    } else {
      throw new Error(`Failed to draft: ${res.statusCode} ${JSON.stringify(res.data)}`);
    }
  } catch (e) {
    console.error('✗ AI Drafting test failed:', e.message);
    process.exit(1);
  }

  // 4. Test User Templates CRUD
  console.log('\n--- TESTING /api/user-templates CRUD ---');
  let savedId = null;
  try {
    const handler = require('./backend/user-templates');
    
    // Test POST
    const { req: reqPost, res: resPost } = mockReqRes('POST', {
      title: 'Harness Test Agreement',
      content: 'This is a test template content.'
    });
    await handler(reqPost, resPost);
    if (resPost.statusCode === 200 && resPost.data.id) {
      savedId = resPost.data.id;
      console.log(`✓ Template created successfully with ID: ${savedId}`);
    } else {
      throw new Error(`Failed creation: ${resPost.statusCode} ${JSON.stringify(resPost.data)}`);
    }

    // Test GET
    const { req: reqGet, res: resGet } = mockReqRes('GET');
    await handler(reqGet, resGet);
    const found = resGet.data.templates?.some(t => t.id === savedId);
    if (resGet.statusCode === 200 && found) {
      console.log('✓ Template listed in GET response.');
    } else {
      throw new Error(`Failed retrieval: ${resGet.statusCode} ${JSON.stringify(resGet.data)}`);
    }

    // Test DELETE
    const { req: reqDel, res: resDel } = mockReqRes('DELETE', { id: savedId });
    await handler(reqDel, resDel);
    if (resDel.statusCode === 200) {
      console.log('✓ Template deleted successfully.');
    } else {
      throw new Error(`Failed deletion: ${resDel.statusCode} ${JSON.stringify(resDel.data)}`);
    }
  } catch (e) {
    console.error('✗ User templates test failed:', e.message);
    process.exit(1);
  }

  console.log('\n=============================================');
  console.log('🎉 ALL END-TO-END PIPELINE TESTS PASSED!');
  console.log('=============================================');
  process.exit(0);
}

runTests();
