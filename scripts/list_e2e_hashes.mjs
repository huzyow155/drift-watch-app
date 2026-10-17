import fs from 'fs';
import path from 'path';

const e2eDir = path.resolve('docs/evidence/e2e');
const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.json')).sort();

console.log('### Transaction Writes and Reverts');
console.log('FILE | STATUS | RESULT | LEADER EXEC | LEADER MODEL | TX HASH');
console.log('---|---|---|---|---|---');

const readFiles = [];

for (const f of files) {
  if (f.startsWith('read_')) {
    readFiles.push(f);
    continue;
  }
  const p = path.join(e2eDir, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const txHash = data.hash;
  const status = data.status_name;
  const result = data.result_name;
  const leaderReceipt = data.consensus_data?.leader_receipt?.[0];
  const leaderExec = leaderReceipt?.execution_result || 'N/A';
  const leaderModel = leaderReceipt?.node_config?.primary_model?.model || 'N/A';
  console.log(`${f} | ${status} | ${result} | ${leaderExec} | ${leaderModel} | ${txHash}`);
}

console.log('\n### Read Outputs');
console.log('FILE | SUMMARY OUTPUT');
console.log('---|---');
for (const f of readFiles) {
  const p = path.join(e2eDir, f);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  console.log(`${f} | \`${JSON.stringify(data)}\``);
}
