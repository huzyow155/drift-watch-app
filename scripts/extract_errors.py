import re
import os

def extract_errors():
    errors = set()
    for fname in ['contracts/DriftWatch.py', 'contracts/DriftGuard.py']:
        with open(fname, 'r', encoding='ascii') as f:
            content = f.read()
        # Find all gl.vm.UserError(...)
        pattern = r'gl\.vm\.UserError\(\s*(?:f?["\'])(.*?)(?:["\'])\s*\)'
        for m in re.finditer(pattern, content):
            msg = m.group(1)
            errors.add(msg)
    
    print(f"Total extracted UserErrors: {len(errors)}")
    for e in sorted(errors):
        print(f"  '{e}'")

if __name__ == '__main__':
    extract_errors()
