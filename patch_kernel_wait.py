"""Patch the pinned JupyterLite worker proxy for synchronous waitAsync results."""
from pathlib import Path
import hashlib

RELATIVE = Path('extensions/@jupyterlite/pyodide-kernel-extension/static/88.4eef6fd43c0373bf.js')
ORIGINAL_SHA256 = 'b82a9c9b83b06c03921a422d2ee2eef6715cf10f0579022b238a28d54feda25c'
OLD = 'A(u,s).value.then('
NEW = 'Promise.resolve(A(u,s).value).then('

def patch(root):
    target = Path(root) / RELATIVE
    data = target.read_bytes()
    if hashlib.sha256(data).hexdigest() != ORIGINAL_SHA256:
        raise RuntimeError('Unexpected JupyterLite kernel proxy; review before patching')
    source = data.decode('utf-8')
    if source.count(OLD) != 2:
        raise RuntimeError('Unexpected JupyterLite waitAsync call sites')
    target.write_text(source.replace(OLD, NEW), encoding='utf-8')
