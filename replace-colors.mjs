import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        try {
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(walk(file));
            } else {
                results.push(file);
            }
        } catch (e) {
            // ignore
        }
    });
    return results;
}

const files = walk('./src').filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));

// Tailwind v4 + Semantic Colors replacements
const replacements = [
    // Backgrounds
    { from: /bg-\[\#0[aA]0[aA]0[aA]\]/g, to: 'bg-background' },
    { from: /bg-\[\#141414\]/g, to: 'bg-card' },
    { from: /bg-\[\#1[aA]1[aA]1[aA]\]/g, to: 'bg-card' },
    { from: /bg-gray-900/g, to: 'bg-card' },
    { from: /bg-gray-800/g, to: 'bg-card' },

    // Borders
    { from: /border-\[\#1[aA]1[aA]1[aA]\]/g, to: 'border-border' },
    { from: /border-\[\#222\]/g, to: 'border-border' },
    { from: /border-\[\#333\]/g, to: 'border-border' },
    { from: /border-gray-800/g, to: 'border-border' },

    // Texts
    { from: /text-gray-400/g, to: 'text-muted' },
    { from: /text-gray-500/g, to: 'text-muted' },
];

let updatedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // First replace the main backgrounds and borders
    replacements.forEach(r => {
        content = content.replace(r.from, r.to);
    });

    // Special case for text-white. We only want to replace it if it's not inside a colored button
    // A simplistic approach is just replacing all text-white with text-foreground
    // and then we can manually fix if any buttons get ruined.
    // Given the project style, text-white is used everywhere.
    content = content.replace(/text-white/g, 'text-foreground');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Total files updated: ${updatedCount}`);
