// Maps contract gl.vm.UserError strings to user-friendly UI explanations.
// Every UserError string from DriftWatch.py and DriftGuard.py is covered.

export interface ErrorMapping {
  raw: string;
  title: string;
  explanation: string;
  action: string;
}

export const ERROR_MAPPINGS: Record<string, { title: string; explanation: string; action: string }> = {
  'unknown watch': {
    title: 'Watch Not Found',
    explanation: 'The requested watch ID does not exist in the contract repository.',
    action: 'Verify the watch ID or select a watch from the dashboard list.'
  },
  'unknown check': {
    title: 'Check Record Not Found',
    explanation: 'The requested check ID does not exist in contract storage.',
    action: 'Verify the check ID from the watch checks list.'
  },
  'not owner': {
    title: 'Unauthorized (Owner Only)',
    explanation: 'Only the wallet address that created this watch may execute this action.',
    action: 'Switch your connected wallet to the watch creator address.'
  },
  'watch needs baseline': {
    title: 'Baseline Required',
    explanation: 'This watch cannot be evaluated because an initial baseline snapshot has not been established.',
    action: 'Click Set Baseline as the watch owner before running checks.'
  },
  'watch already active': {
    title: 'Baseline Already Anchored',
    explanation: 'This watch has already established its active baseline snapshot.',
    action: 'Proceed to running checks or updating source URL.'
  },
  'invalid name: must be 3-60 ASCII characters': {
    title: 'Invalid Watch Name',
    explanation: 'Watch names must contain between 3 and 60 standard ASCII characters.',
    action: 'Shorten or adjust the watch name using printable ASCII characters.'
  },
  'invalid URL: scheme must be https': {
    title: 'Insecure URL Scheme',
    explanation: 'Monitored URLs must use the secure https:// protocol scheme.',
    action: 'Ensure the URL begins with https://.'
  },
  'invalid URL: length exceeds 300 characters': {
    title: 'URL Too Long',
    explanation: 'Target URL length exceeds the contract ceiling of 300 characters.',
    action: 'Use a canonical, shorter URL path under 300 characters.'
  },
  'invalid URL: userinfo not allowed': {
    title: 'User Credentials Not Allowed',
    explanation: 'Embedded credentials (username/password) are forbidden in monitored URLs.',
    action: 'Remove username and password authentication from the URL.'
  },
  'invalid URL: port must be empty or 443': {
    title: 'Non-Standard Port',
    explanation: 'The contract only accepts standard HTTPS port 443 or omitted port.',
    action: 'Remove explicit non-443 port specifications.'
  },
  'invalid URL: fragment not allowed': {
    title: 'URL Fragment Not Allowed',
    explanation: 'URI fragment anchors (#) are not transmitted in HTTP GET requests.',
    action: 'Remove the # fragment anchor from the target URL.'
  },
  'invalid URL: IP literals not allowed': {
    title: 'IP Literal Forbidden',
    explanation: 'Raw IPv4 and IPv6 addresses are not permitted. A valid domain name is required.',
    action: 'Provide a registered domain hostname instead of an IP address.'
  },
  'invalid URL: invalid host': {
    title: 'Invalid Hostname',
    explanation: 'Target hostname is missing, too short, or refers to localhost or local networks.',
    action: 'Enter a valid public domain name (e.g. example.com).'
  },
  'invalid red lines: invalid JSON array': {
    title: 'Invalid Red Lines Format',
    explanation: 'Red lines must be formatted as a valid JSON array of strings.',
    action: 'Ensure input parses as a JSON list of text strings.'
  },
  'invalid red lines: count must be between 1 and 5': {
    title: 'Invalid Red Lines Count',
    explanation: 'You must specify between 1 and 5 red line boundaries.',
    action: 'Provide at least 1 and at most 5 plain English red lines.'
  },
  'invalid red lines: each line must be 5-200 ASCII characters': {
    title: 'Invalid Red Line Text',
    explanation: 'Each red line must be between 5 and 200 ASCII characters in length.',
    action: 'Adjust each line length between 5 and 200 printable characters.'
  },
  'host mismatch: new URL host must match existing host': {
    title: 'Host Mismatch On Update',
    explanation: 'Target source updates must remain on the exact same registered hostname.',
    action: 'Keep the same domain host when updating paths (e.g. version migrations).'
  },
  'page too large': {
    title: 'Page Payload Exceeded',
    explanation: 'The fetched page payload exceeds the maximum safety limit of 400,000 bytes.',
    action: 'Point to a concise terms page or policy document under 400 KB.'
  },
  'page unreadable (too little text; it may need JavaScript)': {
    title: 'Page Unreadable',
    explanation: 'The retrieved page contains fewer than 200 characters of readable text, possibly requiring client-side JavaScript rendering.',
    action: 'Ensure the server serves pre-rendered HTML text upon HTTP GET.'
  },
  'cannot accept UNCHANGED check as baseline': {
    title: 'No Change To Accept',
    explanation: 'An UNCHANGED check has identical content to the current baseline and cannot advance it.',
    action: 'Only accept checks that surfaced cosmetic, minor, or material revisions.'
  },
  'check does not belong to this watch': {
    title: 'Check ID Mismatch',
    explanation: 'The provided check record belongs to a different watch identifier.',
    action: 'Verify that the check ID corresponds to this active watch.'
  },
  'snapshot clauses no longer stored for this check': {
    title: 'Snapshot Pruned',
    explanation: 'Clause text snapshots are only preserved on-chain for the 3 newest checks.',
    action: 'Run a fresh check against the current page to capture an active snapshot.'
  },
  'source unreachable': {
    title: 'Source Unreachable',
    explanation: 'Validators could not establish an HTTP connection to the target server.',
    action: 'Verify that the target server is online and publicly reachable.'
  },
  'no pin found for caller': {
    title: 'Pin Not Found',
    explanation: 'Your connected wallet has not pinned baseline hashes for this watch in DriftGuard.',
    action: 'Call Pin first to anchor your security verification baseline.'
  },
  'watch is not active': {
    title: 'Watch Inactive',
    explanation: 'DriftGuard can only pin watches that have completed baseline initialization.',
    action: 'Wait for the watch owner to set the baseline before pinning.'
  }
};

export function parseContractError(rawError: unknown): { title: string; message: string; action?: string } {
  const str = typeof rawError === 'string' ? rawError : (rawError as { message?: string })?.message || String(rawError);

  // Check for regex/dynamic patterns
  const dupMatch = str.match(/duplicate observation: already recorded in check (\d+)/);
  if (dupMatch) {
    return {
      title: 'Duplicate Observation',
      message: `Identical page state has already been evaluated against this baseline in check #${dupMatch[1]}. State unchanged.`,
      action: 'A new check is only recorded when upstream page content or the baseline changes.'
    };
  }

  const httpMatch = str.match(/HTTP status not 200: (\d+)/);
  if (httpMatch) {
    return {
      title: 'HTTP Fetch Failed',
      message: `The monitored server returned HTTP status code ${httpMatch[1]} instead of 200 OK.`,
      action: 'Check that the URL path exists and is publicly accessible.'
    };
  }

  // Check exact mapping
  for (const [key, map] of Object.entries(ERROR_MAPPINGS)) {
    if (str.includes(key)) {
      return {
        title: map.title,
        message: map.explanation,
        action: map.action,
      };
    }
  }

  // Network consensus disagreement
  if (str.includes('UNDETERMINED') || str.includes('MAJORITY_DISAGREE')) {
    return {
      title: 'Consensus Disagreement',
      message: 'Validators reached an UNDETERMINED / MAJORITY_DISAGREE state on this call. Contract state remains unchanged.',
      action: 'Retry transaction after network or source stability returns.'
    };
  }

  return {
    title: 'Transaction Error',
    message: str.slice(0, 200),
    action: 'Check browser console or transaction receipt for detailed VM trace.'
  };
}
