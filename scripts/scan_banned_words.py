import os
import sys
import re

# Banned words according to rules:
# testnet, Live (as status word / standalone title), unanimous, tamper-proof, bytecode, cryptographic proof, "tampered", "autonomous"
# finalized (ONLY allowed as literal status_name like 'FINALIZED' or `finalized`)

BANNED_PATTERNS = [
    (r'\btestnet\b', 'testnet (use Studionet or GenLayer Studionet)'),
    (r'\bunanimous\b', 'unanimous'),
    (r'\btamper-proof\b', 'tamper-proof'),
    (r'\bbytecode\b', 'bytecode'),
    (r'\bcryptographic proof\b', 'cryptographic proof'),
    (r'\btampered\b', 'tampered'),
    (r'\btampering\b', 'tampering'),
    (r'\bautonomous\b', 'autonomous'),
]

# Check for 'live' as standalone word (case-insensitive unless code/identifier)
LIVE_PATTERN = re.compile(r'\blive\b', re.IGNORECASE)

# Finalized is only allowed as uppercase FINALIZED or status_name == 'FINALIZED'
FINALIZED_BANNED = re.compile(r'\bfinalized\b', re.IGNORECASE)

DIRECTORIES_TO_SCAN = ['src', 'public', 'scripts', 'docs']
EXTENSIONS = ('.ts', '.tsx', '.js', '.mjs', '.html', '.json', '.md')

violations = []

for root_dir in DIRECTORIES_TO_SCAN:
    for root, dirs, files in os.walk(root_dir):
        # Ignore node_modules
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith(EXTENSIONS):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                for line_idx, line in enumerate(lines, 1):
                    # Check banned patterns
                    for pat, reason in BANNED_PATTERNS:
                        if re.search(pat, line, re.IGNORECASE):
                            violations.append((filepath, line_idx, reason, line.strip()))
                    # Check 'Live'
                    if LIVE_PATTERN.search(line):
                        # Allow if part of an identifier like livereload or commented out
                        if 'Live' in line:
                            violations.append((filepath, line_idx, "Live as status/title word", line.strip()))
                    # Check 'finalized' outside literal status_name
                    for m in FINALIZED_BANNED.finditer(line):
                        matched = m.group(0)
                        # Allowed if literal 'FINALIZED' or `status_name` context
                        if matched == 'FINALIZED' or 'status_name' in line or 'receipt.status_name' in line:
                            continue
                        violations.append((filepath, line_idx, f"finalized outside literal: '{matched}'", line.strip()))

# Check root markdown and html files
ROOT_FILES_TO_SCAN = ['README.md', 'index.html', 'MANUAL_METAMASK_TEST.md']
for root_file in ROOT_FILES_TO_SCAN:
    if os.path.exists(root_file):
        with open(root_file, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        for line_idx, line in enumerate(lines, 1):
            for pat, reason in BANNED_PATTERNS:
                if re.search(pat, line, re.IGNORECASE):
                    violations.append((root_file, line_idx, reason, line.strip()))
            if LIVE_PATTERN.search(line):
                violations.append((root_file, line_idx, "live/Live as status/descriptor word", line.strip()))
            for m in FINALIZED_BANNED.finditer(line):
                matched = m.group(0)
                if matched == 'FINALIZED' or 'status_name' in line:
                    continue
                violations.append((root_file, line_idx, f"finalized outside literal: '{matched}'", line.strip()))

if violations:
    print(f"FOUND {len(violations)} BANNED WORD VIOLATIONS:")
    for v in violations:
        print(f"  {v[0]}:{v[1]} - {v[2]} -> {v[3]}")
    sys.exit(1)
else:
    print("PASS: Zero banned words detected across project files.")
