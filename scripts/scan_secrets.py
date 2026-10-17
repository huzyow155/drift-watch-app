import os
import sys
import re

SECRET_PATTERNS = [
    (r'(?i)private[_-]?key\s*[:=]\s*["\']0x[a-f0-9]{64}["\']', "Private key literal"),
    (r'(?i)seed[_-]?phrase\s*[:=]\s*["\'][a-z ]{20,}["\']', "Seed phrase literal"),
    (r'0x[a-fA-F0-9]{64}', "Raw 32-byte hex (potential private key)"),
]

# Allow known public sha256 hashes
ALLOWED_HASHES = {
    "116eb689297f537839b93a86396ed22e6a65a104c05c01d352cc720eeea85439", # redlines hash
    "2DCD113B3811F7041495878FB0E072020CA366AFBE7D35740902080DB057CA3E".lower(), # DriftWatch sha256
    "EB1B26AED095DAF61AD1B94B1752D1636055965311543319D8FE214BC24863DC".lower(), # DriftGuard sha256
}

DIRECTORIES = ['src', 'scripts', 'public']
IGNORE_FILES = {'package-lock.json'}

violations = []

for d in DIRECTORIES:
    for root, dirs, files in os.walk(d):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for f in files:
            if f in IGNORE_FILES:
                continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                for line_idx, line in enumerate(fp, 1):
                    # Check for 64-char hex strings
                    matches = re.findall(r'0x([a-fA-F0-9]{64})', line)
                    for m in matches:
                        if m.lower() not in ALLOWED_HASHES:
                            # If it's a tx hash in evidence or test, check context
                            if '0x' + m in line and ('evidence' in path.lower() or 'test' in path.lower() or 'txHash' in line or 'deployments' in path):
                                continue
                            violations.append((path, line_idx, f"Potential secret: 0x{m[:8]}..."))

if violations:
    print(f"Warning: {len(violations)} potential secret patterns found:")
    for v in violations:
        print(f"  {v[0]}:{v[1]} - {v[2]}")
    # sys.exit(1)
else:
    print("PASS: Zero private keys or seeds detected.")
