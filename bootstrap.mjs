const params=new URLSearchParams(location.search),owner=params.get('codi_owner');
if(!/^[a-f0-9]{64}$/.test(owner||''))throw Error('Account identity required');
const node=document.getElementById('jupyter-config-data'),config=JSON.parse(node.textContent);Object.assign(config,{contentsStorageName:'Codi notebooks '+owner,settingsStorageName:'Codi notebook settings '+owner,workspacesStorageName:'Codi notebook workspaces '+owner,exposeAppInBrowser:'true'});node.textContent=JSON.stringify(config);
await import('./config-utils.js');
