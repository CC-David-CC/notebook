#!/usr/bin/env python3
"""Prepare pinned browser-local JupyterLite assets. Generated files are ignored by Git."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

HERE = Path(__file__).resolve().parent
COMMITMENT = '1016c31e39ce3764d9a418cbb491a392c802c1b86ccc1367f009f5c59bf8f5fd'
COMM_SHA = 'c615d91d75f7f04f095b30d1c1711babd43bdc6419c1be9886a85f2f4e489417'
ASSETS = json.loads((HERE / 'app.json').read_text())['assets']

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def fetch(url, path, expected):
    with urllib.request.urlopen(url, timeout=120) as response, path.open('wb') as target:
        shutil.copyfileobj(response, target)
    if sha(path) != expected:
        raise RuntimeError('Checksum mismatch: ' + path.name)

with tempfile.TemporaryDirectory(prefix='codi-jupyterlite-') as tmp:
    tmp = Path(tmp); tar = tmp / 'pyodide-core-314.0.6.tar.bz2'; source = tmp / 'site'; lite = tmp / 'empty'; lite.mkdir()
    fetch('https://github.com/pyodide/pyodide/releases/download/314.0.6/pyodide-core-314.0.6.tar.bz2', tar, COMMITMENT)
    subprocess.run([sys.executable, '-m', 'jupyter', 'lite', 'build', '--lite-dir', str(lite), '--output-dir', str(source), '--pyodide', str(tar)], check=True)
    html = source / 'lab/index.html'; text = html.read_text(); match = re.search(r'<script>\s*([\s\S]*?)\s*</script>', text)
    if not match: raise RuntimeError('JupyterLite bootstrap changed')
    html.write_text(text[:match.start()] + '<script type="module" src="../codi-bootstrap.mjs"></script>' + text[match.end():])
    shutil.copyfile(HERE / 'bootstrap.mjs', source / 'codi-bootstrap.mjs')
    config = source / 'config-utils.js'; text = config.read_text(); marker = '  // rewrite the config\n'
    patch = '''  // Bind browser storage to the signed-in Codi account before startup.\n  const codiOwner = new URLSearchParams(window.location.search).get('codi_owner');\n  if (!/^[a-f0-9]{64}$/.test(codiOwner || '')) throw Error('Account identity required');\n  config.contentsStorageName = 'Codi notebooks ' + codiOwner;\n  config.settingsStorageName = 'Codi notebook settings ' + codiOwner;\n  config.workspacesStorageName = 'Codi notebook workspaces ' + codiOwner;\n  config.exposeAppInBrowser = 'true';\n\n'''
    if text.count(marker) != 1: raise RuntimeError('JupyterLite configuration changed')
    config.write_text(text.replace(marker, patch + marker))
    py = source / 'static/pyodide'; packages = json.loads((py / 'pyodide-lock.json').read_text())['packages']; by_file = {v['file_name']: v for v in packages.values()}
    for asset in ASSETS:
        prefix = 'node_modules/jupyterlite/static/pyodide/'
        if not asset.startswith(prefix): continue
        file = asset[len(prefix):]
        if file not in by_file: continue
        fetch('https://cdn.jsdelivr.net/pyodide/v314.0.6/full/' + file, py / file, by_file[file]['sha256'])
    subprocess.run([sys.executable, '-m', 'pip', 'download', '--no-deps', '--only-binary=:all:', 'comm==0.2.3', '-d', str(tmp)], check=True)
    comm = tmp / 'comm-0.2.3-py3-none-any.whl'
    if sha(comm) != COMM_SHA: raise RuntimeError('Unexpected comm wheel')
    pypi = source / 'extensions/@jupyterlite/pyodide-kernel-extension/static/pypi'; shutil.copyfile(comm, pypi / comm.name)
    index = pypi / 'all.json'; data = json.loads(index.read_text()); entry = dict(data['piplite']['releases'][next(iter(data['piplite']['releases']))][0]); raw = comm.read_bytes(); md5 = hashlib.md5(raw).hexdigest()
    entry.update({'filename': comm.name, 'url': './' + comm.name, 'size': len(raw), 'digests': {'sha256': COMM_SHA, 'md5': md5}, 'md5_digest': md5, 'requires_python': '>=3.8'})
    data['comm'] = {'releases': {'0.2.3': [entry]}}; index.write_text(json.dumps(data, indent=2) + '\n')
    settings = source / 'jupyter-lite.json'; data = json.loads(settings.read_text()); data['jupyter-config-data']['litePluginSettings']['@jupyterlite/pyodide-kernel-extension:kernel']['pipliteUrls'] = ['./extensions/@jupyterlite/pyodide-kernel-extension/static/pypi/all.json?sha256=' + sha(index)]; settings.write_text(json.dumps(data, indent=2) + '\n')
    destination = HERE / 'node_modules/jupyterlite'
    for asset in ASSETS:
        if not asset.startswith('node_modules/jupyterlite/'): continue
        rel = Path(asset).relative_to('node_modules/jupyterlite'); original = source / rel; target = destination / rel
        if not original.is_file() or original.is_symlink(): raise RuntimeError('Missing JupyterLite asset: ' + str(rel))
        target.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(original, target)
print('Prepared JupyterLite 0.8.6 and local Pyodide 314.0.6.')
