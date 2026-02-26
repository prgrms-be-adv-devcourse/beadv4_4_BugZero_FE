const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src');

const replacements = [
    { regex: /bg-\[#111\]/g, replacement: 'bg-card' },
    { regex: /bg-\[#222\]/g, replacement: 'bg-muted/30' },
    { regex: /bg-\[#333\]/g, replacement: 'bg-border' },
    { regex: /bg-\[#070707\]/g, replacement: 'bg-background' },
    { regex: /bg-\[#111111\]\/50/g, replacement: 'bg-card/50' },
    { regex: /bg-\[#111111\]\/80/g, replacement: 'bg-card/80' },
    { regex: /bg-\[#111111\]/g, replacement: 'bg-card' },
    { regex: /bg-\[#222222\]/g, replacement: 'bg-muted' },
    { regex: /bg-\[#0f0f0f\]/g, replacement: 'bg-card' },
    { regex: /bg-\[#0d0d0d\]/g, replacement: 'bg-card' },
    { regex: /bg-\[#262626\]/g, replacement: 'bg-muted' },
    { regex: /bg-\[#080808\]/g, replacement: 'bg-card' },
    { regex: /bg-\[#181818\]/g, replacement: 'bg-card' },
    { regex: /border-gray-700/g, replacement: 'border-border' },
    { regex: /bg-\[var\(--lego-yellow\)\]\/10/g, replacement: 'bg-primary/10' },
    { regex: /border-\[var\(--lego-yellow\)\]\/20/g, replacement: 'border-primary/20' },
    { regex: /bg-\[var\(--lego-yellow\)\]/g, replacement: 'bg-primary' }
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        if (file.startsWith('.')) continue; // skip hidden files and .DS_Store
        const fullPath = path.join(directory, file);
        try {
            if (fs.statSync(fullPath).isDirectory()) {
                processDirectory(fullPath);
            } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let modified = false;
                replacements.forEach(({ regex, replacement }) => {
                    if (regex.test(content)) {
                        content = content.replace(regex, replacement);
                        modified = true;
                    }
                });
                if (modified) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log(`Updated: ${fullPath.replace(__dirname, '')}`);
                }
            }
        } catch (err) {
            console.error(`Skipped ${fullPath}: ${err.message}`);
        }
    }
}

processDirectory(dirPath);
console.log('Done replacing hardcoded hex colors.');
