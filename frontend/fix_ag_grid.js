const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getFiles('src');
let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Remove ag-theme-alpine from classNames
  if (content.includes('ag-theme-alpine')) {
    content = content.replace(/ag-theme-alpine\s*/g, '');
    changed = true;
  }

  // 2. Replace theme="legacy" with theme={themeAlpine}
  if (content.includes('theme="legacy"')) {
    content = content.replace(/theme="legacy"/g, 'theme={themeAlpine}');
    changed = true;
  }

  if (changed && content.includes('<AgGridReact')) {
    // 3. Ensure themeAlpine is imported
    if (!content.includes('themeAlpine')) {
      if (content.includes('from \'ag-grid-community\'') || content.includes('from "ag-grid-community"')) {
        content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]ag-grid-community['"]/g, (match, p1) => {
          if (!p1.includes('themeAlpine')) {
            return `import { ${p1.trim()}, themeAlpine } from 'ag-grid-community'`;
          }
          return match;
        });
      } else {
        const imports = content.match(/^import.*$/gm);
        if (imports && imports.length > 0) {
          const lastImport = imports[imports.length - 1];
          content = content.replace(lastImport, lastImport + "\nimport { themeAlpine } from 'ag-grid-community';");
        }
      }
    }
    fs.writeFileSync(file, content);
    updatedCount++;
    console.log('Updated: ' + file);
  }
}
console.log('Total files updated: ' + updatedCount);
