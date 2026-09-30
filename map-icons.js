const fs = require('fs');
const path = require('path');

const map = {
    'gg-shield-check': 'gg-check-o',
    'gg-newspaper': 'gg-file-document',
    'gg-activity': 'gg-pulse',
    'gg-hard-drive': 'gg-drive',
    'gg-zap': 'gg-bolt',
    'gg-users': 'gg-user',
    'gg-upload': 'gg-software-upload',
    'gg-arrow-up-down': 'gg-arrows-v',
    'gg-plus-square': 'gg-add-r',
    'gg-upload-cloud': 'gg-cloud-upload',
    'gg-x': 'gg-close',
    'gg-calendar': 'gg-calendar-dates',
    'gg-corner-left-up': 'gg-arrow-left-up'
};

const replaceInFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    for (const [key, value] of Object.entries(map)) {
        content = content.replace(new RegExp(key, 'g'), value);
    }
    
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

console.log('Icon mapping complete.');
