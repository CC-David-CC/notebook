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
export function textLoss(notebook){return (notebook.cells||[]).some(cell=>cell.cell_type==='raw'||cell.attachments&&Object.keys(cell.attachments).length||cell.outputs?.length||Object.keys(cell.metadata||{}).length)||Object.keys(notebook.metadata||{}).length>0;}
// Read only authored cells; avoid copying potentially large output payloads on every execution event.
export function authoredModel(model){const cells=model.cells,result=[];for(let i=0;i<cells.length;i++){const cell=cells.get(i),source=cell.sharedModel?.getSource?.();if(typeof source!=='string'||typeof cell.type!=='string')return authoredContent(model.toJSON());result.push({type:cell.type,source});}return JSON.stringify(result);}
