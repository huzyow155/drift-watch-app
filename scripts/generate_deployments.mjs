import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDeploymentsPath = path.resolve('E:/DriftWatch_V2/scripts/deploy/deployments.json');
const targetDeploymentsTsPath = path.resolve(__dirname, '../src/config/deployments.ts');

if (!fs.existsSync(sourceDeploymentsPath)) {
  console.error('Source deployments.json not found at:', sourceDeploymentsPath);
  process.exit(1);
}

const raw = fs.readFileSync(sourceDeploymentsPath, 'utf8');
const data = JSON.parse(raw);

const targetDir = path.dirname(targetDeploymentsTsPath);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const tsContent = `// Generated automatically from contract repo scripts/deploy/deployments.json
// Single source of truth for contract addresses on Studionet.

export interface ContractDeployment {
  address: \`0x\${string}\`;
  deployTxHash: string;
  sha256: string;
  explorer: string;
}

export interface SupersededDeployment {
  driftWatch: ContractDeployment;
  driftGuard: ContractDeployment;
  deployedAt: string;
  status: string;
  reason: string;
}

export interface DeploymentsConfig {
  network: string;
  chainId: number;
  rpc: string;
  explorerBase: string;
  contractRepoHead: string;
  driftWatch: ContractDeployment;
  driftGuard: ContractDeployment;
  deployedAt: string;
  superseded: SupersededDeployment[];
}

export const DEPLOYMENTS: DeploymentsConfig = {
  network: ${JSON.stringify(data.network)},
  chainId: ${data.chainId},
  rpc: ${JSON.stringify(data.rpc)},
  explorerBase: ${JSON.stringify(data.explorerBase)},
  contractRepoHead: "01fc90c6911d3d4564a397196c702b2de3f00fb2",
  driftWatch: {
    address: ${JSON.stringify(data.driftWatch.address)} as \`0x\${string}\`,
    deployTxHash: ${JSON.stringify(data.driftWatch.deployTxHash)},
    sha256: ${JSON.stringify(data.driftWatch.sha256)},
    explorer: ${JSON.stringify(data.driftWatch.explorer)},
  },
  driftGuard: {
    address: ${JSON.stringify(data.driftGuard.address)} as \`0x\${string}\`,
    deployTxHash: ${JSON.stringify(data.driftGuard.deployTxHash)},
    sha256: ${JSON.stringify(data.driftGuard.sha256)},
    explorer: ${JSON.stringify(data.driftGuard.explorer)},
  },
  deployedAt: ${JSON.stringify(data.deployedAt)},
  superseded: ${JSON.stringify(data.superseded, null, 2)},
};
`;

fs.writeFileSync(targetDeploymentsTsPath, tsContent, 'utf8');
console.log('Successfully generated src/config/deployments.ts');
