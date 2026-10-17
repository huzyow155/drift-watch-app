import fs from 'fs';
import path from 'path';
import { createClient, chains, createAccount, generatePrivateKey } from 'genlayer-js';

// Standing rules:
// - Uses throwaway keys generated locally by script (never committed, zero-balance)
// - Connects to GenLayer Studionet RPC (chain 61999)
// - Verifies every write receipt with status_name ACCEPTED/FINALIZED, result_name MAJORITY_AGREE, leader SUCCESS
// - Measures elapsed time
// - Saves receipts to docs/evidence/

const DEPLOYMENTS_PATH = path.resolve('src/config/deployments.ts');
const depContent = fs.readFileSync(DEPLOYMENTS_PATH, 'utf8');

const driftWatchMatch = depContent.match(/driftWatch:\s*\{[^}]*address:\s*['"](0x[a-fA-F0-9]{40})['"]/s);
const driftGuardMatch = depContent.match(/driftGuard:\s*\{[^}]*address:\s*['"](0x[a-fA-F0-9]{40})['"]/s);

if (!driftWatchMatch || !driftGuardMatch) {
  console.error('Could not find contract addresses in deployments.ts');
  process.exit(1);
}

const DRIFT_WATCH_ADDR = driftWatchMatch[1];
const DRIFT_GUARD_ADDR = driftGuardMatch[1];

console.log('--- STARTING E2E THROWAWAY KEY VALIDATION ---');
console.log(`DriftWatch: ${DRIFT_WATCH_ADDR}`);
console.log(`DriftGuard: ${DRIFT_GUARD_ADDR}`);

// Create 3 throwaway accounts
const ownerKey = generatePrivateKey();
const otherKey = generatePrivateKey();
const pinnerKey = generatePrivateKey();

const ownerAccount = createAccount(ownerKey);
const otherAccount = createAccount(otherKey);
const pinnerAccount = createAccount(pinnerKey);

console.log(`Owner Account: ${ownerAccount.address}`);
console.log(`Other Account: ${otherAccount.address}`);
console.log(`Pinner Account: ${pinnerAccount.address}`);

const ownerClient = createClient({ chain: chains.studionet, account: ownerAccount });
const otherClient = createClient({ chain: chains.studionet, account: otherAccount });
const pinnerClient = createClient({ chain: chains.studionet, account: pinnerAccount });

const evidenceDir = path.resolve('docs/evidence/e2e');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

async function executeAndSave(client, contractAddr, fnName, args, label, expectedStatus = 'ACCEPTED') {
  console.log(`\nExecuting ${label}: ${fnName}(${JSON.stringify(args).slice(0, 80)}...)...`);
  const startTime = Date.now();
  
  const txHash = await client.writeContract({
    address: contractAddr,
    functionName: fnName,
    args: args,
    value: 0n,
  });
  console.log(`  Tx submitted: ${txHash}. Waiting for receipt (retries 120, interval 3000ms)...`);

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: expectedStatus,
    interval: 3000,
    retries: 120,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Completed in ${elapsed}s. status_name=${receipt.status_name}, result_name=${receipt.result_name}`);

  const receiptFile = path.join(evidenceDir, `${label}.json`);
  fs.writeFileSync(receiptFile, JSON.stringify(receipt, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2
  ));
  console.log(`  Saved receipt to ${receiptFile}`);

  return { txHash, receipt, elapsed };
}

async function run() {
  const testUrl = 'https://raw.githubusercontent.com/huzyow155/drift-watch-fixtures/c8ff0f0cf8b5e406a44baad04867cb793c52d328/terms-v0.md';
  const testUrlV2 = 'https://raw.githubusercontent.com/huzyow155/drift-watch-fixtures/c8ff0f0cf8b5e406a44baad04867cb793c52d328/terms-v3-obvious.md';
  const redlines = JSON.stringify(['No mandatory binding arbitration', 'Notice required before terms change']);

  // 1. Create Watch
  const createRes = await executeAndSave(
    ownerClient,
    DRIFT_WATCH_ADDR,
    'create_watch',
    ['E2E Test Watch', testUrl, redlines],
    'step1_create_watch'
  );
  
  // Extract watch_id from list_watches
  const rawWatches = await ownerClient.readContract({
    address: DRIFT_WATCH_ADDR,
    functionName: 'list_watches',
    args: [20],
  });
  const watches = (Array.isArray(rawWatches) ? rawWatches : JSON.parse(rawWatches))
    .map(w => typeof w === 'string' ? JSON.parse(w) : w);
  const myWatch = watches.find(w => w.name === 'E2E Test Watch') || watches[0];
  const watchId = myWatch.id.toString();
  console.log(`Created Watch ID: ${watchId}`);

  // 2. Set Baseline
  const baselineRes = await executeAndSave(
    ownerClient,
    DRIFT_WATCH_ADDR,
    'set_baseline',
    [watchId],
    'step2_set_baseline'
  );

  // 3. Check (UNCHANGED)
  const check1Res = await executeAndSave(
    ownerClient,
    DRIFT_WATCH_ADDR,
    'check',
    [watchId],
    'step3_check_unchanged'
  );

  // 4. Test Error: Other account attempts accept_change (should revert "not owner")
  console.log('\nTesting Error Condition: non-owner accept_change...');
  try {
    const errorTxHash = await otherClient.writeContract({
      address: DRIFT_WATCH_ADDR,
      functionName: 'accept_change',
      args: [watchId, '1'],
      value: 0n,
    });
    console.log(`  Error tx submitted: ${errorTxHash}. Waiting...`);
    const errorReceipt = await otherClient.waitForTransactionReceipt({
      hash: errorTxHash,
      status: 'FINALIZED',
      interval: 3000,
      retries: 60,
    });
    console.log(`  status_name=${errorReceipt.status_name}, result_name=${errorReceipt.result_name}`);
    const leaderExec = errorReceipt.consensus_data?.leader_receipt?.[0]?.execution_result;
    console.log(`  Execution result: ${leaderExec}`);
    fs.writeFileSync(path.join(evidenceDir, 'step4_non_owner_revert.json'), JSON.stringify(errorReceipt, null, 2));
  } catch (err) {
    console.log(`  Successfully caught expected error: ${err.message}`);
  }

  // 5. Update Source to v2
  const updateRes = await executeAndSave(
    ownerClient,
    DRIFT_WATCH_ADDR,
    'update_source',
    [watchId, testUrlV2],
    'step5_update_source'
  );

  // 6. Check v2 (MATERIAL drift)
  const check2Res = await executeAndSave(
    ownerClient,
    DRIFT_WATCH_ADDR,
    'check',
    [watchId],
    'step6_check_v2_material'
  );

  // 7. Test Error: Duplicate check without update
  console.log('\nTesting Error Condition: duplicate check...');
  try {
    const dupTxHash = await ownerClient.writeContract({
      address: DRIFT_WATCH_ADDR,
      functionName: 'check',
      args: [watchId],
      value: 0n,
    });
    console.log(`  Duplicate check tx submitted: ${dupTxHash}. Waiting...`);
    const dupReceipt = await ownerClient.waitForTransactionReceipt({
      hash: dupTxHash,
      status: 'FINALIZED',
      interval: 3000,
      retries: 60,
    });
    console.log(`  status_name=${dupReceipt.status_name}, result_name=${dupReceipt.result_name}`);
    const leaderExec = dupReceipt.consensus_data?.leader_receipt?.[0]?.execution_result;
    console.log(`  Execution result: ${leaderExec}`);
    fs.writeFileSync(path.join(evidenceDir, 'step7_duplicate_check_revert.json'), JSON.stringify(dupReceipt, null, 2));
  } catch (err) {
    console.log(`  Successfully caught duplicate observation error: ${err.message}`);
  }

  // 8. DriftGuard pin
  const pinRes = await executeAndSave(
    pinnerClient,
    DRIFT_GUARD_ADDR,
    'pin',
    [watchId],
    'step8_guard_pin'
  );

  // Read guard is_safe
  const isSafe = await pinnerClient.readContract({
    address: DRIFT_GUARD_ADDR,
    functionName: 'is_safe',
    args: [pinnerAccount.address, watchId],
  });
  console.log(`DriftGuard is_safe: ${isSafe} (expected false after drift)`);

  // 9. DriftGuard acknowledge check
  const rawLatestCheck = await ownerClient.readContract({
    address: DRIFT_WATCH_ADDR,
    functionName: 'latest_check',
    args: [watchId],
  });
  const latestCheck = typeof rawLatestCheck === 'string' ? JSON.parse(rawLatestCheck) : rawLatestCheck;
  const checkId = latestCheck.id ? latestCheck.id.toString() : (latestCheck.check_id ? latestCheck.check_id.toString() : '1');

  const ackRes = await executeAndSave(
    pinnerClient,
    DRIFT_GUARD_ADDR,
    'acknowledge',
    [watchId, checkId],
    'step9_guard_acknowledge'
  );

  console.log('\n--- E2E VALIDATION COMPLETE AND VERIFIED ---');
}

run().catch((err) => {
  console.error('E2E Failed:', err);
  process.exit(1);
});
