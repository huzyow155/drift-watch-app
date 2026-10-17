import { DEPLOYMENTS } from '../config/deployments';
import { getGenLayerClient } from './watchRead';
import { verifyReceiptSuccess, WriteResult } from './watchWrite';
import { parseContractError } from '../lib/errors';

export interface GuardStatus {
  safe: 'true' | 'false';
  reason: 'NO_PIN' | 'NO_CHECK_YET' | 'OK' | 'ALARM' | 'ACKNOWLEDGED' | 'BASELINE_CHANGED' | 'REDLINES_CHANGED';
  latest_check_id: string;
  latest_verdict: string;
}

export interface PinRecord {
  pinner: string;
  watch_id: string;
  pinned_baseline_norm_hash: string;
  pinned_redlines_hash: string;
  acknowledged_check_id: string;
  schema_version: string;
}

export async function fetchGuardStatus(pinner: string, watchId: string): Promise<GuardStatus> {
  const client = getGenLayerClient();
  const raw = await client.readContract({
    address: DEPLOYMENTS.driftGuard.address,
    functionName: 'is_safe',
    args: [pinner, String(watchId)],
  });
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as GuardStatus);
}

export async function fetchIsSafeFor(
  pinner: string,
  watchId: string,
  baselineNormHash: string,
  redlinesHash: string
): Promise<boolean> {
  const client = getGenLayerClient();
  const res = await client.readContract({
    address: DEPLOYMENTS.driftGuard.address,
    functionName: 'is_safe_for',
    args: [pinner, String(watchId), baselineNormHash, redlinesHash],
  });
  return Boolean(res);
}

export async function fetchPin(pinner: string, watchId: string): Promise<PinRecord | null> {
  const client = getGenLayerClient();
  try {
    const raw = await client.readContract({
      address: DEPLOYMENTS.driftGuard.address,
      functionName: 'get_pin',
      args: [pinner, String(watchId)],
    });
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as PinRecord);
  } catch {
    return null;
  }
}

export async function executeGuardWrite(
  client: any,
  fnName: 'pin' | 'acknowledge' | 'repin',
  args: any[],
  onProgress?: (elapsed: number, stage: string) => void
): Promise<WriteResult> {
  const t0 = Date.now();
  let timer: any;
  if (onProgress) {
    timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - t0) / 1000);
      const stage = elapsed > 60 ? 'Validators are still working...' : 'Confirming guard action...';
      onProgress(elapsed, stage);
    }, 1000);
  }

  try {
    const txHash = await client.writeContract({
      address: DEPLOYMENTS.driftGuard.address,
      functionName: fnName,
      args,
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      retries: 120,
      interval: 3000,
    });

    if (timer) clearInterval(timer);
    const elapsedSeconds = parseFloat(((Date.now() - t0) / 1000).toFixed(2));
    verifyReceiptSuccess(receipt, fnName);

    const leaderModel = receipt.consensus_data?.leader_receipt?.[0]?.node_config?.primary_model?.model;

    return {
      success: true,
      txHash,
      elapsedSeconds,
      statusName: receipt.status_name,
      resultName: receipt.result_name,
      leaderExecution: receipt.consensus_data?.leader_receipt?.[0]?.execution_result || 'SUCCESS',
      leaderModel,
    };
  } catch (err: any) {
    if (timer) clearInterval(timer);
    const elapsedSeconds = parseFloat(((Date.now() - t0) / 1000).toFixed(2));
    const parsed = parseContractError(err);
    return {
      success: false,
      txHash: err.hash || '',
      elapsedSeconds,
      statusName: err.status_name || 'ERROR',
      resultName: err.result_name || 'ERROR',
      leaderExecution: 'ERROR',
      error: parsed,
    };
  }
}
