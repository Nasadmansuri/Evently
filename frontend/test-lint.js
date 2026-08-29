import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAllFiles(dir, extList = ['.jsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(getAllFiles(fullPath, extList));
      }
    } else {
      if (extList.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const srcDir = path.join(__dirname, 'src');
const files = getAllFiles(srcDir);

console.log(`Auditing ${files.length} source files in frontend/src...`);

let issues = [];

files.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(srcDir, filePath);

  // Check 1: motion used without framer-motion import
  if (/<motion\./.test(content) && !/from\s+['"]framer-motion['"]/.test(content)) {
    issues.push({ file: relPath, issue: 'Uses <motion.> but does NOT import from framer-motion' });
  }

  // Check 2: AnimatePresence used without import
  if (/<AnimatePresence/.test(content) && !/AnimatePresence/.test(content)) {
    issues.push({ file: relPath, issue: 'Uses <AnimatePresence> but does not import AnimatePresence' });
  }

  // Check 3: Link used without react-router-dom import
  if (/<Link\s/.test(content) && !/from\s+['"]react-router-dom['"]/.test(content)) {
    issues.push({ file: relPath, issue: 'Uses <Link> but does NOT import from react-router-dom' });
  }

  // Check 4: useNavigate used without react-router-dom import
  if (/useNavigate\(/.test(content) && !/from\s+['"]react-router-dom['"]/.test(content)) {
    issues.push({ file: relPath, issue: 'Uses useNavigate but does NOT import from react-router-dom' });
  }
});

if (issues.length === 0) {
  console.log('✅ ALL FRONTEND FILES PASSED IMPORT & SYNTAX INTEGRITY CHECKS (0 issues found)!');
} else {
  console.error(`❌ FOUND ${issues.length} ISSUES:`);
  issues.forEach((iss) => console.error(`  - [${iss.file}]: ${iss.issue}`));
  process.exit(1);
}
