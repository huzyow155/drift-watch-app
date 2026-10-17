import { createClient, chains } from 'genlayer-js';
import { DEPLOYMENTS } from '../config/deployments';

export const studionetChain = chains.studionet;

export function getGenLayerClient() {
  return createClient({
    chain: studionetChain,
  });
}

export interface WatchRecord {
  id: string;
  name: string;
  url: string;
  host: string;
  owner: string;
  status: 'NEEDS_BASELINE' | 'ACTIVE';
  baseline_norm_hash: string;
  baseline_raw_hash: string;
  baseline_check_id: string;
  baseline_seq: string;
  red_lines: string[];
  redlines_hash: string;
  source_history: string[];
  seq: string;
  schema_version: string;
}

export interface CheckRecord {
  id: string;
  watch_id: string;
  caller: string;
  verdict: 'UNCHANGED' | 'COSMETIC' | 'NONE' | 'MINOR' | 'MATERIAL' | 'REVIEW';
  norm_hash: string;
  raw_hash16: string;
  baseline_norm_hash: string;
  redlines_hash: string;
  changes: Array<{
    kind: 'MODIFIED' | 'ADDED' | 'REMOVED';
    old: string;
    new: string;
  }>;
  change_labels: string[];
  redline_flags: string[];
  gate: string;
  tripwire: string;
  snapshot_clauses: string[];
  snapshot_dropped: string;
  seq: string;
  schema_version: string;
}

export interface WatchStats {
  schema_version: string;
  stat_total_checks: string;
  stat_verdict_UNCHANGED: string;
  stat_verdict_COSMETIC: string;
  stat_verdict_NONE: string;
  stat_verdict_MINOR: string;
  stat_verdict_MATERIAL: string;
  stat_verdict_REVIEW: string;
}

export interface WatchLimits {
  schema_version: string;
  max_url_len: string;
  max_page_bytes: string;
  min_text_chars: string;
  max_changes_judged: string;
  max_name_len: string;
  min_name_len: string;
  max_red_lines: string;
  min_red_lines: string;
  max_red_line_chars: string;
  min_red_line_chars: string;
  snapshot_retention_checks: string;
}

export async function fetchStats(): Promise<WatchStats> {
  const client = getGenLayerClient();
  const raw = await client.readContract({
    address: DEPLOYMENTS.driftWatch.address,
    functionName: 'get_stats',
    args: [],
  });
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as WatchStats);
}

export async function fetchLimits(): Promise<WatchLimits> {
  const client = getGenLayerClient();
  const raw = await client.readContract({
    address: DEPLOYMENTS.driftWatch.address,
    functionName: 'get_limits',
    args: [],
  });
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as WatchLimits);
}

export async function fetchWatch(watchId: string): Promise<WatchRecord> {
  const client = getGenLayerClient();
  const raw = await client.readContract({
    address: DEPLOYMENTS.driftWatch.address,
    functionName: 'get_watch',
    args: [String(watchId)],
  });
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as WatchRecord);
}

export async function fetchListWatches(limit: number = 20): Promise<WatchRecord[]> {
  const client = getGenLayerClient();
  const rawList = await client.readContract({
    address: DEPLOYMENTS.driftWatch.address,
    functionName: 'list_watches',
    args: [limit],
  });
  const arr = Array.isArray(rawList) ? rawList : (typeof rawList === 'string' ? JSON.parse(rawList) : []);
  return arr.map((item: unknown) => typeof item === 'string' ? JSON.parse(item) : item);
}

export async function fetchCheck(checkId: string): Promise<CheckRecord> {
  const client = getGenLayerClient();
  const raw = await client.readContract({
    address: DEPLOYMENTS.driftWatch.address,
    functionName: 'get_check',
    args: [String(checkId)],
  });
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as CheckRecord);
}

export async function fetchListChecks(watchId: string, limit: number = 20): Promise<CheckRecord[]> {
  const client = getGenLayerClient();
  const rawList = await client.readContract({
    address: DEPLOYMENTS.driftWatch.address,
    functionName: 'list_checks',
    args: [String(watchId), limit],
  });
  const arr = Array.isArray(rawList) ? rawList : (typeof rawList === 'string' ? JSON.parse(rawList) : []);
  return arr.map((item: unknown) => typeof item === 'string' ? JSON.parse(item) : item);
}

export async function fetchLatestCheck(watchId: string): Promise<CheckRecord | null> {
  const client = getGenLayerClient();
  try {
    const raw = await client.readContract({
      address: DEPLOYMENTS.driftWatch.address,
      functionName: 'latest_check',
      args: [String(watchId)],
    });
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown as CheckRecord);
  } catch {
    return null;
  }
}

export async function fetchComputeRedlinesHash(redlinesJson: string): Promise<string> {
  const client = getGenLayerClient();
  const raw = await client.readContract({
    address: DEPLOYMENTS.driftWatch.address,
    functionName: 'compute_redlines_hash',
    args: [redlinesJson],
  });
  return String(raw);
}
