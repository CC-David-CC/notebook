// Runs separately from both the desktop UI and the user's Python kernel.
import {loadPyodide} from './node_modules/jupyterlite/static/pyodide/pyodide.mjs';
const root = new URL('./node_modules/jupyterlite/static/pyodide/', import.meta.url);
const wheels = ['jupytext-1.19.6-py3-none-any.whl','markdown_it_py-4.2.0-py3-none-any.whl','mdit_py_plugins-0.6.1-py3-none-any.whl','mdurl-0.1.2-py3-none-any.whl','nbformat-5.11.1-py3-none-any.whl','fastjsonschema-2.22.3-py3-none-any.whl','jupyter_core-5.9.1-py3-none-any.whl'];
let ready;
async function runtime(){
 if(!ready) ready=(async()=>{const py=await loadPyodide({indexURL:root.href});await py.loadPackage(['micropip','pyyaml','jsonschema','platformdirs','traitlets','packaging']);py.globals.set('codi_wheels',wheels.map(name=>new URL(name,root).href));await py.runPythonAsync('import micropip\nawait micropip.install(codi_wheels.to_py(), deps=False)');await py.runPythonAsync(`import json, jupytext, nbformat\nfrom jupytext.config import JupytextConfiguration\ndef codi_convert(action, value, fmt):\n    if action == 'read':\n        return json.dumps(jupytext.reads(value, fmt=fmt), ensure_ascii=False)\n    if action == 'write':\n        notebook = nbformat.from_dict(json.loads(value))\n        config = JupytextConfiguration(notebook_metadata_filter='-all', cell_metadata_filter='-all')\n        return jupytext.writes(notebook, fmt=fmt, config=config)\n    raise ValueError('Unknown conversion')`);return py;})();
 return ready;
}
self.onmessage=async ({data})=>{const {id,action,value,format}=data||{};try{if(!Number.isSafeInteger(id)||!['read','write'].includes(action)||!['py:light','py:percent'].includes(format)||typeof value!=='string')throw Error('Invalid conversion request');const py=await runtime(),fn=py.globals.get('codi_convert');let result;try{result=fn(action,value,format);}finally{fn.destroy();}self.postMessage({id,result});}catch(error){self.postMessage({id,error:String(error?.message||error)});}};
