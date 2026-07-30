const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\\\Users\\\\LENOVO\\\\.gemini\\\\antigravity-ide\\\\brain\\\\7dc98484-3026-4a1f-8f31-b19158cf3882\\\\.system_generated\\\\logs\\\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let fileContentLines = {};

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'TOOL_RESPONSE' && entry.content && entry.content.includes('dashboard.html')) {
         if (entry.step_index < 2700) {
             const lines = entry.content.split('\n');
             for (const l of lines) {
                 const match = l.match(/^(\d+):\s(.*)$/);
                 if (match) {
                     const lineNum = parseInt(match[1], 10);
                     const text = match[2];
                     if (!fileContentLines[lineNum]) {
                         fileContentLines[lineNum] = text;
                     }
                 }
             }
         }
      }
    } catch(e) {}
  }
  
  const maxLine = Math.max(...Object.keys(fileContentLines).map(Number));
  let finalFile = "";
  for(let i=1; i<=maxLine; i++) {
      finalFile += (fileContentLines[i] !== undefined ? fileContentLines[i] : "") + "\n";
  }
  fs.writeFileSync('c:\\\\Users\\\\LENOVO\\\\OneDrive\\\\Desktop\\\\hack-1\\\\dashboard_recovered.html', finalFile);
  console.log('Recovered to dashboard_recovered.html up to line ' + maxLine);
}
processLineByLine();
