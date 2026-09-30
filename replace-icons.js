const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace data-lucide="icon" with class="gg-icon"
    content = content.replace(/data-lucide="([^"]+)"/g, 'class="gg-$1"');
    
    // Remove lucide script tags
    content = content.replace(/<script>\s*lucide\.createIcons\(\);\s*(?:const btn2.*)?<\/script>/g, '');
    
    // Remove TS lucide references
    content = content.replace(/\/\/ @ts-ignore\s+if \(window\.lucide\) window\.lucide\.createIcons\(\);/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
};

const processDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ejs') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    }
};

processDirectory(path.join(__dirname, 'views'));
processDirectory(path.join(__dirname, 'public', 'ts'));

console.log('Icon replacement complete.');
