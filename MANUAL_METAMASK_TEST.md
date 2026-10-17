# Manual MetaMask Verification Walkthrough (8 Steps)

This document provides human-executable verification steps for testing the DriftWatch dApp with MetaMask on GenLayer Studionet (Chain ID 61999).

---

## Prerequisites
1. Install [MetaMask](https://metamask.io/) in your browser.
2. Have the dApp open in your browser: `https://drift-watch-app-hyper-8cdf.vercel.app` (or `https://drift-watch-app.vercel.app`).
3. Gas price on GenLayer Studionet is 0. No GEN balance is required for non-payable writes.

---

## Step 1: Connect Wallet & Network Verification
1. Click the **Connect Wallet** button in the top navigation bar.
2. Approve the MetaMask connection prompt.
3. If not already on GenLayer Studionet, the dApp prompts `wallet_switchEthereumChain` / `wallet_addEthereumChain` for chain `61999` (RPC: `https://studio.genlayer.com/api`).
4. **Expected:** Header displays your truncated address (e.g., `0x1234...abcd`) and green `Studionet` network pill.

---

## Step 2: Browse Watches & System Limits
1. Navigate to `/app` (Watches).
2. Confirm the active watch cards are rendered (e.g., Watch #1: Acme Terms Watch).
3. Navigate to `/app/limits`.
4. **Expected:** On-chain parameters from `get_limits` load:
   - Max URL Length: 300
   - Max Page Bytes: 500,000
   - Min Cleaned Text: 200
   - Max Changes Judged: 12
   - Snapshot Retention: 5

---

## Step 3: Inspect Watch Detail & Redline Diff
1. From `/app`, click on Watch #1 (or open `/app/watch/1`).
2. Verify the terms source URL: `https://raw.githubusercontent.com/huzyow155/drift-watch-fixtures/c8ff0f0cf8b5e406a44baad04867cb793c52d328/terms-v5-harmless.md`.
3. Check the redlines list (4 items).
4. Review the latest checks history list.
5. Click on an individual check card to inspect the diff visualization.
6. **Expected:** Redlines show deletion (`del` background) and insertion (`ins` background) with classified labels.

---

## Step 4: Salami View (Multi-Hop Creep Inspection)
1. On the Watch #1 page, locate the **Salami Attack Detection** card.
2. Notice the comparison between the original baseline and cumulative changes across checks.
3. **Expected:** Table surfaces individual small changes and flags cumulative semantic drift across multiple revisions.

---

## Step 5: Create a New Watch (`create_watch`)
1. Click **+ New Watch** in the navbar or navigate to `/app/create`.
2. Click the **Use Acme Notes Example** button to pre-fill name, fixture URL, and 4 redlines.
3. Observe client-side SHA-256 hash calculation.
4. Click **Verify on Studionet**: executes `compute_redlines_hash` on-chain and confirms client and contract hashes match.
5. Click **Create Watch on Studionet**.
6. MetaMask pops up: confirm the transaction (0 GEN value).
7. **Expected:** An elapsed seconds timer counts up during consensus (takes ~6-12s). The transaction completes with `ACCEPTED` status, redirecting you to `/app`.

---

## Step 6: Set Baseline (`set_baseline`)
1. Open your newly created Watch detail page.
2. Status will show `NEEDS_BASELINE`.
3. Click the **Set Baseline** button.
4. Confirm the transaction in MetaMask.
5. **Expected:** Validators fetch the webpage content and snapshot the clauses. Status updates to `ACTIVE`.

---

## Step 7: Trigger Semantic Check (`check`)
1. With your active Watch selected, click **Run Drift Check**.
2. Confirm the MetaMask transaction.
3. **Expected:** An elapsed timer counts up while validators run the web fetch, diff, and prompt. If the source has not changed, verdict displays `UNCHANGED`.

---

## Step 8: DriftGuard Pin & Consumer `is_safe_for` Test
1. Navigate to `/app/guard`.
2. In the Watch ID query box, enter your Watch ID and click **Read Status**.
3. Click **Pin Current Watch Baseline** to bind your wallet to the current terms hash.
4. Confirm the MetaMask transaction.
5. In the **Synchronous `is_safe_for` Verification** playground:
   - Your pinner address, baseline norm hash, and redlines hash will be pre-filled.
   - Click **Test `is_safe_for`**. Result will show `true (Safe to transact)`.
   - Click the **Change one character** button to simulate malicious hash tampering.
   - Click **Test `is_safe_for`** again.
   - **Expected:** Instant revert / `false`, demonstrating that downstream contracts will block transactions if terms have drifted.
