const fs = require('fs');
const file = 'c:/Users/LENOVO/OneDrive/Desktop/hack-1/dashboard.html';
const lines = fs.readFileSync(file, 'utf8').split('\n');

let htmlIndex = -1;
for (let i = 50; i < lines.length; i++) {
    if (lines[i].includes('<!DOCTYPE html>')) {
        htmlIndex = i;
        break;
    }
}

if (htmlIndex > -1) {
    let dashboardBodyIndex = -1;
    for (let i = htmlIndex; i < lines.length; i++) {
        if (lines[i].includes('<!-- Dashboard Body -->')) {
            dashboardBodyIndex = i;
            break;
        }
    }
    
    if (dashboardBodyIndex > -1) {
        const replacement = [
            '                    <span style="font-weight: 500; font-size: 0.875rem;">Jane Doe</span>',
            '                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>',
            '                </div>',
            '            </div>',
            '        </header>',
            ''
        ];
        
        lines.splice(htmlIndex, dashboardBodyIndex - htmlIndex, ...replacement);
        fs.writeFileSync(file, lines.join('\n'));
        console.log('Fixed duplicate sidebar successfully.');
    } else {
        console.log('Could not find Dashboard Body tag');
    }
} else {
    console.log('Could not find rogue DOCTYPE tag');
}
