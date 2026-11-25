// The editor can register Python after its initial service promises resolve.
export async function waitForPythonSpec(getSpecs, {valid, timeout = 30000,
  now = performance.now.bind(performance), delay = ms => new Promise(resolve => setTimeout(resolve, ms))} = {}) {
  const until = now() + timeout;
  while (valid() && now() < until) {
    if (getSpecs()?.kernelspecs?.python) return;
    await delay(250);
  }
  if (valid()) throw Error('Browser Python kernel is unavailable.');
}

// Explicit non-Python notebook kernels must retain Jupyter's native handling.
export function pythonKernelArgs(content, isPythonText = false) {
  const spec = content?.metadata?.kernelspec;
  return spec?.name === 'python' || (!spec && isPythonText)
    ? {kernelPreference: {name: 'python', autoStartDefault: true}} : {};
}

// Start the deadline when navigation begins, including an iframe that never loads.
export async function waitForNotebookApp(getApp, {valid, timeout = 90000, now = performance.now.bind(performance),
  delay = ms => new Promise(resolve => setTimeout(resolve, ms))} = {}) {
  const until = now() + timeout;
  while (valid() && now() < until) {
    let app;
    try {
      app = getApp();
    } catch (error) {
      if (error.name !== 'SecurityError') throw error;
      // A browser navigation error can leave an inaccessible document in the frame.
      throw Error('The Notebook editor could not be loaded.');
    }
    if (app?.serviceManager?.contents && app.commands?.hasCommand('docmanager:open')) return app;
    await delay(250);
  }
  if (valid()) throw Error('The Notebook editor did not finish loading.');
}

// Wait before enabling Run: Jupyter can drop execution requested during startup.
export async function waitForPython(widget, {valid, timeout = 60000, now = Date.now,
  delay = ms => new Promise(resolve => setTimeout(resolve, ms))} = {}) {
  const until = now() + timeout;
  while (valid() && now() < until) {
    const kernel = widget?.sessionContext?.session?.kernel;
    if (kernel?.status === 'dead') throw Error('Browser Python stopped during startup.');
    if (kernel?.name === 'python' && kernel.status === 'idle' && kernel.connectionStatus === 'connected') return;
    await delay(100);
  }
  if (valid()) throw Error('Browser Python did not become ready.');
}
