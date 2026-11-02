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
import zipfile
from patch_kernel_wait import patch as patch_kernel_wait

HERE = Path(__file__).resolve().parent
COMMITMENT = '1016c31e39ce3764d9a418cbb491a392c802c1b86ccc1367f009f5c59bf8f5fd'
COMM_SHA = 'c615d91d75f7f04f095b30d1c1711babd43bdc6419c1be9886a85f2f4e489417'
WIDGETS_SHA = 'ecaca67aed704a338f88f67b1181b58f821ab5dc89c1f0f5ef99db43c1c2921e'
LAB_WIDGETS_SHA = '45fa36d9c6422cf2559198e4db481aa243c7a32d9926b500781c830c80f7ecf8'
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
    # Install pinned conversion-only wheels beside Pyodide for the private worker.
    conversion_wheels = {'nbformat-5.11.1-py3-none-any.whl': 'cc6698fa75f4fab8755ead786317815f13a6fee3b53311c0abb1a8b51d52f7ec', 'jupytext-1.19.6-py3-none-any.whl': 'eb725d66841f1a91707bdcf4703b194a53151a060ecb3fd31d78139cc9ec090a', 'mdit_py_plugins-0.6.1-py3-none-any.whl': '214c82fb2ac524472ab6a5bcab1de80f73b50443e187f401bfd77efbc7c6481d', 'mdurl-0.1.2-py3-none-any.whl': '84008a41e51615a49fc9966191ff91509e3c40b939176e643fd50a5c2196b8f8', 'jupyter_core-5.9.1-py3-none-any.whl': 'ebf87fdc6073d142e114c72c9e29a9d7ca03fad818c5d300ce2adc1fb0743407', 'fastjsonschema-2.22.3-py3-none-any.whl': 'f670b443830b75aca3f00b75949efa20f4b2a80302ec7a21505c28dd54cffd43', 'markdown_it_py-4.2.0-py3-none-any.whl': '9f7ebbcd14fe59494226453aed97c1070d83f8d24b6fc3a3bcf9a38092641c4a'}
    subprocess.run([sys.executable, '-m', 'pip', 'download', '--no-deps', '--only-binary=:all:', 'jupytext==1.19.6', 'markdown-it-py==4.2.0', 'mdit-py-plugins==0.6.1', 'mdurl==0.1.2', 'nbformat==5.11.1', 'fastjsonschema==2.22.3', 'jupyter-core==5.9.1', '-d', str(tmp)], check=True)
    for filename, expected in conversion_wheels.items():
        wheel = tmp / filename
        if sha(wheel) != expected: raise RuntimeError('Unexpected Jupytext wheel: ' + filename)
        shutil.copyfile(wheel, py / filename)
    subprocess.run([sys.executable, '-m', 'pip', 'download', '--no-deps', '--only-binary=:all:', 'comm==0.2.3', '-d', str(tmp)], check=True)
    comm = tmp / 'comm-0.2.3-py3-none-any.whl'
    if sha(comm) != COMM_SHA: raise RuntimeError('Unexpected comm wheel')
    pypi = source / 'extensions/@jupyterlite/pyodide-kernel-extension/static/pypi'; shutil.copyfile(comm, pypi / comm.name)
    index = pypi / 'all.json'; data = json.loads(index.read_text()); entry = dict(data['piplite']['releases'][next(iter(data['piplite']['releases']))][0]); raw = comm.read_bytes(); md5 = hashlib.md5(raw).hexdigest()
    entry.update({'filename': comm.name, 'url': './' + comm.name, 'size': len(raw), 'digests': {'sha256': COMM_SHA, 'md5': md5}, 'md5_digest': md5, 'requires_python': '>=3.8'})
    data['comm'] = {'releases': {'0.2.3': [entry]}}; index.write_text(json.dumps(data, indent=2) + '\n')
    for name, version, expected in [('ipywidgets', '8.1.8', WIDGETS_SHA), ('jupyterlab_widgets', '3.0.16', LAB_WIDGETS_SHA)]:
        subprocess.run([sys.executable, '-m', 'pip', 'download', '--no-deps', '--only-binary=:all:', name + '==' + version, '-d', str(tmp)], check=True)
        wheel = tmp / (name + '-' + version + '-py3-none-any.whl')
        if sha(wheel) != expected: raise RuntimeError('Unexpected widget wheel: ' + name)
        shutil.copyfile(wheel, pypi / wheel.name)
        raw = wheel.read_bytes(); digest = hashlib.md5(raw).hexdigest(); wheel_entry = dict(entry)
        wheel_entry.update({'filename': wheel.name, 'url': './' + wheel.name, 'size': len(raw), 'digests': {'sha256': expected, 'md5': digest}, 'md5_digest': digest, 'requires_python': '>=3.8'})
        data[name.replace('_', '-')] = {'releases': {version: [wheel_entry]}}
    index.write_text(json.dumps(data, indent=2) + '\n')
    # Make plain `import ipywidgets` load the pinned same-origin wheels through
    # Pyodide's normal loadPackagesFromImports mechanism in each fresh kernel.
    lock_path = py / 'pyodide-lock.json'; lock = json.loads(lock_path.read_text())
    for name, version, wheel, expected, deps in [
        ('comm', '0.2.3', comm, COMM_SHA, ['traitlets']),
        ('ipywidgets', '8.1.8', tmp / 'ipywidgets-8.1.8-py3-none-any.whl', WIDGETS_SHA, ['comm', 'ipython', 'traitlets']),
    ]:
        if name in lock['packages']: raise RuntimeError('Unexpected upstream package in Pyodide lock: ' + name)
        shutil.copyfile(wheel, py / wheel.name)
        lock['packages'][name] = {'depends': deps, 'file_name': wheel.name, 'imports': [name], 'install_dir': 'site', 'name': name, 'package_type': 'package', 'sha256': expected, 'unvendored_tests': False, 'version': version}
    lock_path.write_text(json.dumps(lock, indent=2) + '\n')
    settings = source / 'jupyter-lite.json'; data = json.loads(settings.read_text()); data['jupyter-config-data']['litePluginSettings']['@jupyterlite/pyodide-kernel-extension:kernel']['pipliteUrls'] = ['./extensions/@jupyterlite/pyodide-kernel-extension/static/pypi/all.json?sha256=' + sha(index)]; settings.write_text(json.dumps(data, indent=2) + '\n')
    patch_kernel_wait(source)
    manager = source / 'extensions/@jupyter-widgets/jupyterlab-manager'
    if not (manager / 'package.json').is_file(): raise RuntimeError('Widget frontend manager missing')
    if json.loads((manager / 'package.json').read_text()).get('version') != '5.0.15':
        raise RuntimeError('Unexpected widget manager version')
    # The build environment supplies the extension. Bind its executable assets
    # to the separately hash-verified wheel instead of trusting that environment.
    with zipfile.ZipFile(tmp / 'jupyterlab_widgets-3.0.16-py3-none-any.whl') as wheel:
        prefix = 'jupyterlab_widgets-3.0.16.data/data/share/jupyter/labextensions/@jupyter-widgets/jupyterlab-manager/'
        for name in ASSETS:
            root = 'node_modules/jupyterlite/extensions/@jupyter-widgets/jupyterlab-manager/static/'
            if name.startswith(root):
                relative = name.removeprefix('node_modules/jupyterlite/extensions/@jupyter-widgets/jupyterlab-manager/')
                if (manager / relative).read_bytes() != wheel.read(prefix + relative):
                    raise RuntimeError('Widget manager differs from pinned wheel: ' + relative)
    destination = HERE / 'node_modules/jupyterlite'
    for asset in ASSETS:
        if not asset.startswith('node_modules/jupyterlite/'): continue
        rel = Path(asset).relative_to('node_modules/jupyterlite'); original = source / rel; target = destination / rel
        if not original.is_file() or original.is_symlink(): raise RuntimeError('Missing JupyterLite asset: ' + str(rel))
        target.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(original, target)
print('Prepared JupyterLite 0.8.6 and local Pyodide 314.0.6.')
