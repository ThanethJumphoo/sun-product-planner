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

  if (content.includes('theme={themeAlpine}') && !content.includes("import { themeAlpine } from 'ag-grid-community'") && !content.includes('themeAlpine } from "ag-grid-community"')) {
    // Check if ag-grid-community is imported
    if (content.includes("from 'ag-grid-community'") || content.includes('from "ag-grid-community"')) {
      content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]ag-grid-community['"]/, (match, p1) => {
        if (!p1.includes('themeAlpine')) {
          return `import { ${p1.trim()}, themeAlpine } from 'ag-grid-community'`;
        }
        return match;
      });
    } else {
      // Find last import
      const imports = content.match(/^import.*$/gm);
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        content = content.replace(lastImport, lastImport + "\nimport { themeAlpine } from 'ag-grid-community';");
      } else {
        content = "import { themeAlpine } from 'ag-grid-community';\n" + content;
      }
    }
    fs.writeFileSync(file, content);
    updatedCount++;
    console.log('Fixed imports in: ' + file);
  }
}
console.log('Total files fixed: ' + updatedCount);
