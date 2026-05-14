// Run: node scripts/import_questions.js
// Reads eau_claude_trivia_bank.csv, maps categories, shuffles answers, outputs SQL batches.

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Map CSV category names -> DB category_id
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

// Assign difficulty based on question_id cycling — no difficulty column in CSV
// Distribute roughly: 40% easy, 40% medium, 20% hard
function getDifficulty(qid) {
  const n = parseInt(qid, 10) % 10;
  if (n < 4) return 'easy';
  if (n < 8) return 'medium';
  return 'hard';
}

function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

async function main() {
  const csvPath = path.join('C:\\Users\\Kayode\\Downloads\\eau_claude_trivia_bank.csv');
  const outPath = path.join(__dirname, 'questions_import.sql');

  const rl = readline.createInterface({ input: fs.createReadStream(csvPath) });

  const rows = [];
  let firstLine = true;

  for await (const line of rl) {
    if (firstLine) { firstLine = false; continue; } // skip header
    if (!line.trim()) continue;

    // Parse CSV — values are quoted, commas inside quotes won't split
    const cols = [];
    let inQuote = false, cur = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { cols.push(cur); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur);

    const [qid, question, correct, w1, w2, w3, category, source] = cols;
    if (!question || !correct || !w1 || !w2 || !w3) continue;

    const catId = CAT_MAP[category];
    if (!catId) {
      // Unknown category — skip or fall back to General Knowledge
      // console.warn('Unknown category:', category);
      continue;
    }

    const difficulty = getDifficulty(qid);

    // Shuffle correct answer into random position
    const allAnswers = [correct, w1, w2, w3];
    const pos = parseInt(qid, 10) % 4; // deterministic "shuffle" by qid
    // Swap correct (index 0) to pos
    [allAnswers[0], allAnswers[pos]] = [allAnswers[pos], allAnswers[0]];
    const correctIndex = pos;

    const answersJson = JSON.stringify(allAnswers).replace(/'/g, "''");
    const safeQ = escapeSQL(question);
    const safeSrc = escapeSQL(source || 'csv');

    rows.push(`(gen_random_uuid(), ${catId}, '${difficulty}', '${safeQ}', '${answersJson}'::jsonb, ${correctIndex}, '${safeSrc}', true, now())`);
  }

  console.log(`Processed ${rows.length} rows`);

  // Write SQL in batches of 500
  const BATCH = 500;
  const out = fs.createWriteStream(outPath);
  out.write('-- Auto-generated question import\n');
  out.write('BEGIN;\n\n');

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    out.write(`INSERT INTO questions (id, category_id, difficulty, question, answers, correct_index, source, active, created_at) VALUES\n`);
    out.write(batch.join(',\n'));
    out.write(';\n\n');
  }

  out.write('COMMIT;\n');
  out.end();
  console.log(`Wrote SQL to ${outPath}`);

  // Also output category breakdown
  const catCounts = {};
  // recount from rows length is harder; just log total
  console.log('Done. Run the SQL file against Supabase to import.');
}

main().catch(console.error);
