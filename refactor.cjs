const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(directoryPath);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Dark/Primary backgrounds
    content = content.replace(/bg-(blue|indigo|purple|cyan)-[5-9]00/g, 'bg-primary');
    content = content.replace(/bg-(blue|indigo|purple|cyan)-(50|100|200|300|400)/g, 'bg-secondary');
    
    // Text Primary
    content = content.replace(/text-(blue|indigo|purple|cyan)-[5-9]00/g, 'text-primary');
    content = content.replace(/text-(blue|indigo|purple|cyan)-(50|100|200|300|400)/g, 'text-primary/70');

    // Borders Primary
    content = content.replace(/border-(blue|indigo|purple|cyan)-[1-9]00/g, 'border-primary/20');
    content = content.replace(/border-(blue|indigo|purple|cyan)-50/g, 'border-primary/10');

    // Accent backgrounds
    content = content.replace(/bg-(yellow|orange|amber)-[1-9]00/g, 'bg-accent');
    content = content.replace(/bg-(yellow|orange|amber)-50/g, 'bg-accent/20');
    
    // Text Accent
    content = content.replace(/text-(yellow|orange|amber)-[1-9]00/g, 'text-accent-foreground');

    // Border Accent
    content = content.replace(/border-(yellow|orange|amber)-[1-9]00/g, 'border-accent/20');

    // Destructive
    content = content.replace(/bg-(red|rose|pink)-[1-9]00/g, 'bg-destructive');
    content = content.replace(/bg-(red|rose|pink)-50/g, 'bg-destructive/20');
    content = content.replace(/text-(red|rose|pink)-[1-9]00/g, 'text-destructive');
    content = content.replace(/border-(red|rose|pink)-[1-9]00/g, 'border-destructive/20');

    // Map Green to Primary or Secondary
    content = content.replace(/bg-green-[5-9]00/g, 'bg-primary');
    content = content.replace(/bg-green-(50|100|200|300|400)/g, 'bg-secondary');
    content = content.replace(/text-green-[1-9]00/g, 'text-primary');
    content = content.replace(/border-green-[1-9]00/g, 'border-primary/20');
    content = content.replace(/border-green-50/g, 'border-primary/10');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
