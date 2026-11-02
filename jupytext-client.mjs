// Each window owns a conversion worker. Terminating it cancels in-flight work.
export function createJupytextClient(signal) {
 let worker, next=0, closed=false; const pending=new Map();
 function close(){if(closed)return;closed=true;worker?.terminate();for(const {reject} of pending.values())reject(new DOMException('Notebook conversion cancelled','AbortError'));pending.clear();}
 signal?.addEventListener('abort',close,{once:true});
 async function convert(action, value, format){
  if(closed||signal?.aborted)throw new DOMException('Notebook conversion cancelled','AbortError');
  if(!worker){worker=new Worker(new URL('./jupytext-worker.mjs',import.meta.url),{type:'module'});worker.onmessage=({data})=>{const task=pending.get(data?.id);if(!task)return;pending.delete(data.id);data.error?task.reject(Error(data.error)):task.resolve(data.result);};worker.onerror=()=>{for(const task of pending.values())task.reject(Error('Notebook conversion worker failed.'));pending.clear();worker.terminate();worker=null;};}
  return new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});try{worker.postMessage({id,action,value,format});}catch(error){pending.delete(id);reject(error);}});
 }
 return {convert,close};
}
export function notebookFormat(path){return /\.light\.py$/i.test(path)?'py:light':/\.percent\.py$/i.test(path)?'py:percent':/\.ipynb$/i.test(path)?'ipynb':null;}
export function authoredContent(notebook){return JSON.stringify((notebook.cells||[]).map(cell=>({type:cell.cell_type,source:Array.isArray(cell.source)?cell.source.join(''):cell.source||''})));}
export function textLoss(notebook){return (notebook.cells||[]).some(cell=>cell.cell_type==='raw'||cell.attachments&&Object.keys(cell.attachments).length||cell.outputs?.length||Object.keys(cell.metadata||{}).length)||Object.keys(notebook.metadata||{}).length>0;}
