// Run: node scripts/import_to_supabase.js
// Imports trivia questions from CSV into Supabase via REST API in batches of 200

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');

const SUPABASE_URL = 'https://ootzwfmsjocialwbrgqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdHp3Zm1zam9jaWFsd2JyZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2Mjc3MzEsImV4cCI6MjA5NDIwMzczMX0.gkVXf2QTMeep9DpfMp0i4G339sdihpzYqzCjzwAIirM';

const CAT_MAP = {
  'General Knowledge':                      1,
  'History':                                2,
  'Entertainment: Film & TV':               3,
  'Geography':                              4,
  'Science & Nature':                       5,
  'Food & Drink':                           6,
  'Literature & Books':                     7,
  'Sports':                                 8,
  'Animals':                                9,
  'Entertainment: Music':                  10,
  'Religion & Mythology':                  11,
  'Arts & Culture':                        12,
  'Science: Technology & Computers':       13,
  'Celebrities & Pop Culture':             14,
};

function getDifficulty(qid) {
  const n = parseInt(qid, 10) % 10;
  if (n < 4) return 'easy';
  if (n < 8) return 'medium';
  return 'hard';
}

function parseCSVLine(line) {
  const cols = [];
  let inQuote = false, cur = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { cols.push(cur); cur = ''; continue; }
    cur += ch;
  }
  cols.push(cur);
  return cols;
}

function postJSON(url, data, headers) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };
    const req = https.request(url, opts, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, status: res.statusCode });
        } else {
          resolve({ ok: false, status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function insertBatch(rows) {
  const res = await postJSON(
    `${SUPABASE_URL}/rest/v1/questions`,
    rows,
    {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal',
    }
  );
  return res;
}

async function main() {
  const csvPath = 'C:\\Users\\Kayode\\Downloads\\eau_claude_trivia_bank.csv';
  const rl = readline.createInterface({ input: fs.createReadStream(csvPath) });

  const allRows = [];
  let firstLine = true;
  let skipped = 0;

  for await (const line of rl) {
    if (firstLine) { firstLine = false; continue; }
    if (!line.trim()) continue;

    const cols = parseCSVLine(line);
    const [qid, question, correct, w1, w2, w3, category, source] = cols;
    if (!question || !correct || !w1 || !w2 || !w3) { skipped++; continue; }

    const catId = CAT_MAP[category];
    if (!catId) { skipped++; continue; }

    const difficulty = getDifficulty(qid);
    const allAnswers = [correct, w1, w2, w3];
    const pos = parseInt(qid, 10) % 4;
    [allAnswers[0], allAnswers[pos]] = [allAnswers[pos], allAnswers[0]];

    allRows.push({
      category_id: catId,
      difficulty,
      question,
      answers: allAnswers,
      correct_index: pos,
      source: source || 'csv',
      active: true,
    });
  }

  console.log(`Parsed ${allRows.length} rows (${skipped} skipped)`);

  const BATCH = 200;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const batchNum = Math.floor(i / BATCH) + 1;
    const total = Math.ceil(allRows.length / BATCH);
    process.stdout.write(`Batch ${batchNum}/${total}... `);
    const res = await insertBatch(batch);
    if (res.ok) {
      inserted += batch.length;
      console.log('OK');
    } else {
      errors += batch.length;
      console.log(`FAILED (${res.status}): ${res.body?.slice(0, 200)}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nDone. Inserted: ${inserted}, Errors: ${errors}`);
}

main().catch(console.error);
