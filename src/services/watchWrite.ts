import { createClient, chains, createAccount } from 'genlayer-js';
import { DEPLOYMENTS } from '../config/deployments';
import { parseContractError } from '../lib/errors';

export interface WriteResult {
  success: boolean;
  txHash: string;
  elapsedSeconds: number;
  statusName: string;
  resultName: string;
  leaderExecution: string;
  leaderModel?: string;
  error?: {
    title: string;
    message: string;
    action?: string;
  };
}

export function getClientWithAccount(privateKey: string) {
  const account = createAccount(privateKey as `0x${string}`);
  return {
    client: createClient({
      chain: chains.studionet,
      account,
    }),
    account,
  };
}

export async function ensureStudionetWallet(ethereum: any): Promise<void> {
  const chainIdHex = '0x' + DEPLOYMENTS.chainId.toString(16);
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainIdHex,
            chainName: 'GenLayer Studionet',
            rpcUrls: [DEPLOYMENTS.rpc],
            nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
            blockExplorerUrls: [DEPLOYMENTS.explorerBase],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export function verifyReceiptSuccess(receipt: any, desc: string): void {
  const statusOk = receipt.status_name === 'ACCEPTED' || receipt.status_name === 'FINALIZED';
  const resultOk = receipt.result_name === 'MAJORITY_AGREE';
  const leaderRes = receipt.consensus_data?.leader_receipt?.[0]?.execution_result;
  const leaderOk = leaderRes === 'SUCCESS';

  if (!statusOk || !resultOk || !leaderOk) {
    const rawError = receipt.consensus_data?.leader_receipt?.[0]?.genvm_result?.error_description
      || receipt.consensus_data?.leader_receipt?.[0]?.genvm_result?.raw_error
      || `Write failed [${desc}]: status=${receipt.status_name}, result=${receipt.result_name}, leader=${leaderRes}`;
    throw new Error(rawError);
  }
}

export async function executeWatchWrite(
  client: any,
  fnName: string,
  args: any[],
  onProgress?: (elapsed: number, stage: string) => void
): Promise<WriteResult> {
  const t0 = Date.now();
  let timer: any;
  if (onProgress) {
    timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - t0) / 1000);
      const stage = elapsed > 60 ? 'Validators are still working...' : 'Awaiting consensus...';
      onProgress(elapsed, stage);
    }, 1000);
  }

  try {
    const txHash = await client.writeContract({
      address: DEPLOYMENTS.driftWatch.address,
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
