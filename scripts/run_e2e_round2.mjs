import fs from 'fs';
import path from 'path';
import { createClient, chains, createAccount, generatePrivateKey } from 'genlayer-js';

const DEPLOYMENTS_PATH = path.resolve('src/config/deployments.ts');
const depContent = fs.readFileSync(DEPLOYMENTS_PATH, 'utf8');
const driftWatchMatch = depContent.match(/driftWatch:\s*\{[^}]*address:\s*['"](0x[a-fA-F0-9]{40})['"]/s);
const driftGuardMatch = depContent.match(/driftGuard:\s*\{[^}]*address:\s*['"](0x[a-fA-F0-9]{40})['"]/s);
const DRIFT_WATCH_ADDR = driftWatchMatch[1];
const DRIFT_GUARD_ADDR = driftGuardMatch[1];

const evidenceDir = path.resolve('docs/evidence/e2e');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

async function runRound2() {
  console.log('Generating throwaway keys for Round 2...');
  const ownerKey = generatePrivateKey();
  const pinnerKey = generatePrivateKey();
  const ownerAccount = createAccount(ownerKey);
  const pinnerAccount = createAccount(pinnerKey);

  console.log('Owner:', ownerAccount.address);
  console.log('Pinner:', pinnerAccount.address);

  const ownerClient = createClient({ chain: chains.studionet, account: ownerAccount });
  const pinnerClient = createClient({ chain: chains.studionet, account: pinnerAccount });

  const testUrlV0 = 'https://raw.githubusercontent.com/huzyow155/drift-watch-fixtures/c8ff0f0cf8b5e406a44baad04867cb793c52d328/terms-v0.md';
  const testUrlV2 = 'https://raw.githubusercontent.com/huzyow155/drift-watch-fixtures/c8ff0f0cf8b5e406a44baad04867cb793c52d328/terms-v2-subtle.md';
  const redlines = JSON.stringify([
    'Must not allow sharing of identifiable or non-anonymized user data with third parties.',
    'Must not keep deleted user data for more than 90 days.',
    'Must keep the right of users to export or delete their data.',
    'Must not permit selling personal data.'
  ]);

  async function sendWrite(client, contractAddr, fnName, args, label) {
    console.log(`\nSubmitting ${label}: ${fnName}...`);
    const txHash = await client.writeContract({
      address: contractAddr,
      functionName: fnName,
      args: args,
      value: 0n,
    });
    console.log(`  Tx Hash: ${txHash}. Waiting for receipt...`);
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      status: 'ACCEPTED',
      interval: 3000,
      retries: 120,
    });
    console.log(`  Receipt: status_name=${receipt.status_name}, result_name=${receipt.result_name}`);
    fs.writeFileSync(path.join(evidenceDir, `${label}.json`), JSON.stringify(receipt, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
    return receipt;
  }

  // 1. Create Watch
  await sendWrite(ownerClient, DRIFT_WATCH_ADDR, 'create_watch', ['E2E Round 2 Subtle Watch', testUrlV0, redlines], 'round2_step1_create_watch');

  const rawWatches = await ownerClient.readContract({
    address: DRIFT_WATCH_ADDR,
    functionName: 'list_watches',
    args: [20],
  });
  const watches = (Array.isArray(rawWatches) ? rawWatches : JSON.parse(rawWatches))
    .map(w => typeof w === 'string' ? JSON.parse(w) : w);
  const myWatch = watches.find(w => w.name === 'E2E Round 2 Subtle Watch');
  const watchId = myWatch.id.toString();
  console.log(`Created Watch ID: ${watchId}`);

  // 2. Set Baseline
  await sendWrite(ownerClient, DRIFT_WATCH_ADDR, 'set_baseline', [watchId], 'round2_step2_set_baseline');

  // 3. Pinner Pins Watch before any change
  await sendWrite(pinnerClient, DRIFT_GUARD_ADDR, 'pin', [watchId], 'round2_step3_guard_pin');

  // Read guard is_safe BEFORE change
  const isSafeBefore = await pinnerClient.readContract({
    address: DRIFT_GUARD_ADDR,
    functionName: 'is_safe',
    args: [pinnerAccount.address, watchId],
  });
  console.log('is_safe BEFORE change:', isSafeBefore);
  fs.writeFileSync(path.join(evidenceDir, 'read_is_safe_before_check.json'), JSON.stringify(typeof isSafeBefore === 'string' ? JSON.parse(isSafeBefore) : isSafeBefore, null, 2));

  // 4. Update source to terms-v2-subtle.md
  await sendWrite(ownerClient, DRIFT_WATCH_ADDR, 'update_source', [watchId, testUrlV2], 'round2_step4_update_source_v2');

  // 5. Check watch with v2 (subtle change: removing anonymized requirement)
  const checkReceipt = await sendWrite(ownerClient, DRIFT_WATCH_ADDR, 'check', [watchId], 'round2_step5_check_v2');

  // Read guard is_safe AFTER check (ALARM)
  const isSafeAfterCheck = await pinnerClient.readContract({
    address: DRIFT_GUARD_ADDR,
    functionName: 'is_safe',
    args: [pinnerAccount.address, watchId],
  });
  console.log('is_safe AFTER check:', isSafeAfterCheck);
  fs.writeFileSync(path.join(evidenceDir, 'read_is_safe_after_material_alarm.json'), JSON.stringify(typeof isSafeAfterCheck === 'string' ? JSON.parse(isSafeAfterCheck) : isSafeAfterCheck, null, 2));

  // Get latest check id
  const rawLatestCheck = await ownerClient.readContract({
    address: DRIFT_WATCH_ADDR,
    functionName: 'latest_check',
    args: [watchId],
  });
  const latestCheck = typeof rawLatestCheck === 'string' ? JSON.parse(rawLatestCheck) : rawLatestCheck;
  const checkId = latestCheck.id ? latestCheck.id.toString() : (latestCheck.check_id ? latestCheck.check_id.toString() : '1');
  console.log('Latest check ID:', checkId, 'Verdict:', latestCheck.verdict);

  // 6. DriftGuard acknowledge check
  await sendWrite(pinnerClient, DRIFT_GUARD_ADDR, 'acknowledge', [watchId, checkId], 'round2_step6_guard_acknowledge');

  // Read guard is_safe AFTER acknowledge
  const isSafeAfterAck = await pinnerClient.readContract({
    address: DRIFT_GUARD_ADDR,
    functionName: 'is_safe',
    args: [pinnerAccount.address, watchId],
  });
  console.log('is_safe AFTER acknowledge:', isSafeAfterAck);
  fs.writeFileSync(path.join(evidenceDir, 'read_is_safe_after_acknowledge.json'), JSON.stringify(typeof isSafeAfterAck === 'string' ? JSON.parse(isSafeAfterAck) : isSafeAfterAck, null, 2));

  // 7. DriftGuard repin
  await sendWrite(pinnerClient, DRIFT_GUARD_ADDR, 'repin', [watchId], 'round2_step7_guard_repin');

  // Read guard is_safe AFTER repin
  const isSafeAfterRepin = await pinnerClient.readContract({
    address: DRIFT_GUARD_ADDR,
    functionName: 'is_safe',
    args: [pinnerAccount.address, watchId],
  });
  console.log('is_safe AFTER repin:', isSafeAfterRepin);
  fs.writeFileSync(path.join(evidenceDir, 'read_is_safe_after_repin.json'), JSON.stringify(typeof isSafeAfterRepin === 'string' ? JSON.parse(isSafeAfterRepin) : isSafeAfterRepin, null, 2));

  // Read pin for is_safe_for tests
  const pinDataRaw = await pinnerClient.readContract({
    address: DRIFT_GUARD_ADDR,
    functionName: 'get_pin',
    args: [pinnerAccount.address, watchId],
  });
  const pinData = typeof pinDataRaw === 'string' ? JSON.parse(pinDataRaw) : pinDataRaw;

  // 8. Test is_safe_for TRUE
  const safeForTrue = await pinnerClient.readContract({
    address: DRIFT_GUARD_ADDR,
    functionName: 'is_safe_for',
    args: [pinnerAccount.address, watchId, pinData.pinned_baseline_norm_hash, pinData.pinned_redlines_hash],
  });
  console.log('is_safe_for TRUE:', safeForTrue);
  fs.writeFileSync(path.join(evidenceDir, 'read_is_safe_for_true.json'), JSON.stringify({ is_safe_for: safeForTrue, pin: pinData }, null, 2));

  // 9. Test is_safe_for FALSE (changed hash)
  const alteredHash = pinData.pinned_baseline_norm_hash.slice(0, -1) + (pinData.pinned_baseline_norm_hash.endsWith('0') ? '1' : '0');
  const safeForFalse = await pinnerClient.readContract({
    address: DRIFT_GUARD_ADDR,
    functionName: 'is_safe_for',
    args: [pinnerAccount.address, watchId, alteredHash, pinData.pinned_redlines_hash],
  });
  console.log('is_safe_for FALSE (altered hash):', safeForFalse);
  fs.writeFileSync(path.join(evidenceDir, 'read_is_safe_for_false.json'), JSON.stringify({ is_safe_for: safeForFalse, altered_hash: alteredHash }, null, 2));

  console.log('\n--- ROUND 2 E2E SUBTLE TESTS COMPLETE ---');
}

runRound2().catch(err => {
  console.error('Round 2 Error:', err);
  process.exit(1);
});
