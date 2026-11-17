import fs from 'fs';
import path from 'path';

const suspiciousPatterns = [
  { name: 'Private Key', regex: /BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY/i },
  { name: 'Password assignment', regex: /password\s*[:=]\s*['"][^'"]+['"]/i },
  { name: 'Secret assignment', regex: /secret\s*[:=]\s*['"][^'"]+['"]/i },
  { name: 'API Key assignment', regex: /apikey\s*[:=]\s*['"][^'"]+['"]/i },
  { name: 'Token assignment', regex: /token\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i },
  { name: 'Windows User Path', regex: /C:\\Users\\[a-zA-Z0-9_-]+/i },
  { name: 'GitHub Token', regex: /(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{50,})/ }
];

const ignoredDirs = new Set(['.git', 'node_modules', 'dist']);
const ignoredFiles = new Set(['scan-secrets.mjs']);

function scan(dir) {
  let issues = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      issues = issues.concat(scan(full));
    } else {
      if (ignoredFiles.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (['.ico', '.png', '.jpg', '.exe', '.blockmap'].includes(ext)) continue;
      try {
        const content = fs.readFileSync(full, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          suspiciousPatterns.forEach(pat => {
            if (pat.regex.test(line)) {
              issues.push({
                type: pat.name,
                file: path.relative('.', full).replace(/\\/g, '/'),
                line: idx + 1,
                match: line.trim()
              });
            }
          });
        });
      } catch (err) {}
    }
  }
  return issues;
}

const results = scan('.');
console.log(JSON.stringify(results, null, 2));
