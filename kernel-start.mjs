// Explicit non-Python notebook kernels must retain Jupyter's native handling.
export function pythonKernelArgs(content, isPythonText = false) {
  const spec = content?.metadata?.kernelspec;
  return spec?.name === 'python' || (!spec && isPythonText)
    ? {kernelPreference: {name: 'python', autoStartDefault: true}} : {};
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
