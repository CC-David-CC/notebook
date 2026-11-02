// Each window owns a conversion worker. Terminating it cancels in-flight work.
export function createJupytextClient(signal) {
 let worker, next=0, closed=false; const pending=new Map();
 function rejectPending(error){for(const task of pending.values()){clearTimeout(task.timer);task.reject(error);}pending.clear();}
 function stopWorker(error){worker?.terminate();worker=null;rejectPending(error);}
 function close(){if(closed)return;closed=true;signal?.removeEventListener('abort',close);stopWorker(new DOMException('Notebook conversion cancelled','AbortError'));}
 signal?.addEventListener('abort',close,{once:true});
 async function convert(action, value, format){
  if(closed||signal?.aborted)throw new DOMException('Notebook conversion cancelled','AbortError');
  if(!worker){const current=worker=new Worker(new URL('./jupytext-worker.mjs',import.meta.url),{type:'module'});current.onmessage=({data})=>{if(worker!==current)return;const task=pending.get(data?.id);if(!task)return;pending.delete(data.id);clearTimeout(task.timer);data.error?task.reject(Error(data.error)):task.resolve(data.result);};current.onerror=()=>{if(worker===current)stopWorker(Error('Notebook conversion worker failed.'));};current.onmessageerror=()=>{if(worker===current)stopWorker(Error('Notebook conversion worker returned an unreadable response.'));};}
  return new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>stopWorker(Error('Notebook conversion timed out. Try again or save as .ipynb.')),120000);pending.set(id,{resolve,reject,timer});try{worker.postMessage({id,action,value,format});}catch(error){pending.delete(id);clearTimeout(timer);reject(error);}});
 }
 return {convert,close};
}
export function notebookFormat(path){return /\.light\.py$/i.test(path)?'py:light':/\.percent\.py$/i.test(path)?'py:percent':/\.ipynb$/i.test(path)?'ipynb':null;}
export function authoredContent(notebook){return JSON.stringify((notebook.cells||[]).map(cell=>({type:cell.cell_type,source:Array.isArray(cell.source)?cell.source.join(''):cell.source||''})));}
export function textLoss(notebook){
 const metadata=notebook.metadata||{},kernel=metadata.kernelspec||{},language=metadata.language_info||{},mode=language.codemirror_mode||{};
 const isDefaultKernel=Object.keys(kernel).length===3&&kernel.display_name==='Python (Pyodide)'&&kernel.language==='python'&&kernel.name==='python';
 const isDefaultLanguage=(Object.keys(language).length===1&&language.name==='')||(Object.keys(language).length===7&&Object.keys(mode).length===2&&mode.name==='python'&&mode.version===3&&language.file_extension==='.py'&&language.mimetype==='text/x-python'&&language.name==='python'&&language.nbconvert_exporter==='python'&&language.pygments_lexer==='ipython3'&&language.version==='3.8');
 const jt=metadata.jupytext||{},repr=jt.text_representation||{},isGeneratedJupytext=Object.keys(jt).every(key=>['main_language','notebook_metadata_filter','cell_metadata_filter','text_representation'].includes(key))&&jt.main_language==='python'&&jt.notebook_metadata_filter==='-all'&&jt.cell_metadata_filter==='-all'&&Object.keys(repr).length===2&&repr.extension==='.py'&&['light','percent'].includes(repr.format_name);
 const meaningful=Object.keys(metadata).some(key=>key==='kernelspec'?!isDefaultKernel:key==='language_info'?!isDefaultLanguage:key==='jupytext'?!isGeneratedJupytext:true);
 return (notebook.cells||[]).some(cell=>cell.cell_type==='raw'||cell.attachments&&Object.keys(cell.attachments).length||cell.outputs?.length||Object.keys(cell.metadata||{}).length)||meaningful;
}
// Read only authored cells; avoid copying potentially large output payloads on every execution event.
export function authoredModel(model){const cells=model.cells,result=[];for(let i=0;i<cells.length;i++){const cell=cells.get(i),source=cell.sharedModel?.getSource?.();if(typeof source!=='string'||typeof cell.type!=='string')return authoredContent(model.toJSON());result.push({type:cell.type,source});}return JSON.stringify(result);}
