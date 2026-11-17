import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const acorn = require('acorn');

const isApply = process.argv.includes('--apply');
const isDryRun = !isApply;

// Directories and files to exclude
const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'desktop/node_modules',
  'tools',
  'dist',
  'desktop/dist'
]);

const EXCLUDE_FILES = new Set([
  'LICENSE',
  'assets/icons.svg',
  'desktop/build/icon.svg'
]);

function shouldExclude(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  for (const dir of EXCLUDE_DIRS) {
    if (norm === dir || norm.startsWith(dir + '/')) return true;
  }
  return EXCLUDE_FILES.has(norm);
}

/**
 * Strips comments from JavaScript code using Acorn AST tokenizer
 */
function stripJsComments(code) {
  const comments = [];
  try {
    const tokenizer = acorn.tokenizer(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
      onComment: (isBlock, text, start, end) => {
        comments.push({ isBlock, text, start, end });
      }
    });
    // Consume tokens to extract all comments
    while (tokenizer.getToken().type !== acorn.tokTypes.eof) {}
  } catch (err) {
    // If strict module parse fails (e.g. CJS script), try as script
    try {
      const tokenizer = acorn.tokenizer(code, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        locations: true,
        onComment: (isBlock, text, start, end) => {
          comments.push({ isBlock, text, start, end });
        }
      });
      while (tokenizer.getToken().type !== acorn.tokTypes.eof) {}
    } catch (e2) {
      console.warn('Acorn parse error:', err.message);
      return { code, count: 0 };
    }
  }

  if (comments.length === 0) return { code, count: 0 };

  // Sort descending by start position to safely slice
  comments.sort((a, b) => b.start - a.start);

  let result = code;
  for (const c of comments) {
    const before = result.slice(0, c.start);
    const after = result.slice(c.end);

    // Check if the comment took the entire line (only whitespace before it on that line)
    const lastNewlineBefore = before.lastIndexOf('\n');
    const linePrefix = lastNewlineBefore === -1 ? before : before.slice(lastNewlineBefore + 1);
    const firstNewlineAfter = after.indexOf('\n');
    const lineSuffix = firstNewlineAfter === -1 ? after : after.slice(0, firstNewlineAfter);

    if (linePrefix.trim() === '' && lineSuffix.trim() === '') {
      // Entire line is comment
      const cutStart = lastNewlineBefore === -1 ? 0 : lastNewlineBefore + 1;
      const cutEnd = firstNewlineAfter === -1 ? result.length : c.end + firstNewlineAfter + 1;
      result = result.slice(0, cutStart) + result.slice(cutEnd);
    } else {
      // Partial line comment (trailing on code line)
      result = before.replace(/[ \t]+$/, '') + after;
    }
  }

  // Clean up excess blank lines (>1 blank line in a row) and trailing whitespace
  result = cleanupWhitespace(result);
  return { code: result, count: comments.length };
}

/**
 * State-machine comment stripper for CSS (preserves strings and URLs)
 */
function stripCssComments(code) {
  let count = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inUrl = false;
  let inComment = false;
  let commentStart = -1;
  const commentRanges = [];

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        commentRanges.push({ start: commentStart, end: i + 2 });
        i++; // skip /
        count++;
      }
    } else if (inSingleQuote) {
      if (ch === '\\') i++; // skip escaped char
      else if (ch === "'") inSingleQuote = false;
    } else if (inDoubleQuote) {
      if (ch === '\\') i++; // skip escaped char
      else if (ch === '"') inDoubleQuote = false;
    } else if (inUrl) {
      if (ch === ')') inUrl = false;
    } else {
      if (ch === '/' && next === '*') {
        inComment = true;
        commentStart = i;
        i++; // skip *
      } else if (ch === "'") {
        inSingleQuote = true;
      } else if (ch === '"') {
        inDoubleQuote = true;
      } else if (code.slice(i, i + 4).toLowerCase() === 'url(') {
        inUrl = true;
        i += 3;
      }
    }
  }

  if (commentRanges.length === 0) return { code, count: 0 };

  commentRanges.sort((a, b) => b.start - a.start);
  let result = code;
  for (const r of commentRanges) {
    const before = result.slice(0, r.start);
    const after = result.slice(r.end);
    const lastNewlineBefore = before.lastIndexOf('\n');
    const linePrefix = lastNewlineBefore === -1 ? before : before.slice(lastNewlineBefore + 1);
    const firstNewlineAfter = after.indexOf('\n');
    const lineSuffix = firstNewlineAfter === -1 ? after : after.slice(0, firstNewlineAfter);

    if (linePrefix.trim() === '' && lineSuffix.trim() === '') {
      const cutStart = lastNewlineBefore === -1 ? 0 : lastNewlineBefore + 1;
      const cutEnd = firstNewlineAfter === -1 ? result.length : r.end + firstNewlineAfter + 1;
      result = result.slice(0, cutStart) + result.slice(cutEnd);
    } else {
      result = before.replace(/[ \t]+$/, '') + after;
    }
  }

  result = cleanupWhitespace(result);
  return { code: result, count };
}

/**
 * State-machine comment stripper for HTML (preserves scripts, styles, doctype)
 */
function stripHtmlComments(code) {
  let count = 0;
  const commentRanges = [];

  let i = 0;
  while (i < code.length) {
    // Check for comment <!--
    if (code.slice(i, i + 4) === '<!--') {
      const start = i;
      const endIdx = code.indexOf('-->', i + 4);
      if (endIdx !== -1) {
        const end = endIdx + 3;
        commentRanges.push({ start, end });
        count++;
        i = end;
        continue;
      }
    }
    // Check for script tag
    const scriptMatch = code.slice(i).match(/^<script\b[^>]*>/i);
    if (scriptMatch) {
      const scriptOpenEnd = i + scriptMatch[0].length;
      const scriptCloseIdx = code.slice(scriptOpenEnd).search(/<\/script>/i);
      if (scriptCloseIdx !== -1) {
        const jsCode = code.slice(scriptOpenEnd, scriptOpenEnd + scriptCloseIdx);
        const strippedJs = stripJsComments(jsCode);
        if (strippedJs.count > 0) {
          count += strippedJs.count;
          code = code.slice(0, scriptOpenEnd) + strippedJs.code + code.slice(scriptOpenEnd + scriptCloseIdx);
          i = scriptOpenEnd + strippedJs.code.length;
          continue;
        }
      }
    }
    i++;
  }

  if (commentRanges.length === 0) return { code, count };

  commentRanges.sort((a, b) => b.start - a.start);
  let result = code;
  for (const r of commentRanges) {
    const before = result.slice(0, r.start);
    const after = result.slice(r.end);
    const lastNewlineBefore = before.lastIndexOf('\n');
    const linePrefix = lastNewlineBefore === -1 ? before : before.slice(lastNewlineBefore + 1);
    const firstNewlineAfter = after.indexOf('\n');
    const lineSuffix = firstNewlineAfter === -1 ? after : after.slice(0, firstNewlineAfter);

    if (linePrefix.trim() === '' && lineSuffix.trim() === '') {
      const cutStart = lastNewlineBefore === -1 ? 0 : lastNewlineBefore + 1;
      const cutEnd = firstNewlineAfter === -1 ? result.length : r.end + firstNewlineAfter + 1;
      result = result.slice(0, cutStart) + result.slice(cutEnd);
    } else {
      result = before.replace(/[ \t]+$/, '') + after;
    }
  }

  result = cleanupWhitespace(result);
  return { code: result, count };
}

function cleanupWhitespace(str) {
  // Trim trailing whitespace per line
  let lines = str.split('\n').map(l => l.replace(/[ \t]+$/, ''));
  // Collapse 3 or more empty lines into 1
  let cleanLines = [];
  let blankCount = 0;
  for (const line of lines) {
    if (line.trim() === '') {
      blankCount++;
      if (blankCount <= 1) cleanLines.push('');
    } else {
      blankCount = 0;
      cleanLines.push(line);
    }
  }
  // Trim leading/trailing empty lines
  while (cleanLines.length > 0 && cleanLines[0].trim() === '') cleanLines.shift();
  return cleanLines.join('\n') + '\n';
}

function walk(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative('.', full);
    if (shouldExclude(rel)) continue;
    if (entry.isDirectory()) {
      files = files.concat(walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walk('.');
const statsByType = {};

for (const filePath of allFiles) {
  const ext = path.extname(filePath).toLowerCase();
  const relPath = path.relative('.', filePath).replace(/\\/g, '/');
  if (!['.js', '.cjs', '.mjs', '.css', '.html'].includes(ext)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  let result = { code: content, count: 0 };

  if (['.js', '.cjs', '.mjs'].includes(ext)) {
    result = stripJsComments(content);
  } else if (ext === '.css') {
    result = stripCssComments(content);
  } else if (ext === '.html') {
    result = stripHtmlComments(content);
  }

  const typeKey = ext.toUpperCase().replace('.', '');
  statsByType[typeKey] = statsByType[typeKey] || { files: 0, comments: 0 };
  if (result.count > 0) {
    statsByType[typeKey].files++;
    statsByType[typeKey].comments += result.count;
    if (isApply) {
      fs.writeFileSync(filePath, result.code, 'utf8');
      console.log(`[APPLIED] ${relPath}: stripped ${result.count} comments`);
    } else {
      console.log(`[DRY-RUN] ${relPath}: found ${result.count} comments`);
    }
  }
}

console.log('\n================ COMMENT STRIPPING SUMMARY ================');
console.log(`Mode: ${isApply ? 'APPLY' : 'DRY-RUN'}`);
for (const [type, data] of Object.entries(statsByType)) {
  console.log(`${type}: ${data.comments} comments across ${data.files} files`);
}
console.log('===========================================================\n');
