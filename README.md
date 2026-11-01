# Python Notebook

This app embeds JupyterLite with the browser-local Pyodide Python kernel. Run
Python in the notebook; Linux terminal programs and subprocesses use the
separate temporary v86 environment and are not the Pyodide kernel.
New notebooks start with an editable example that calculates the mean of
measurements. Run it with Shift+Enter or the notebook's Run button. The
collapsible getting-started guide explains this and the storage boundary. The
file chooser defers automatic saves until a selection or cancellation finishes.

Use Jupyter’s **File → Open from My files** for a saved `.ipynb`, or **File → Save to My files** to save it. Enter a path under My files when prompted. The original Jupyter file actions operate on temporary internal working copies; they do not replace saving to My files. If the desktop cannot integrate with Jupyter’s menu, its separate file controls remain available. The notebook is saved to the account's browser storage and
then synchronized with the server. After the first save, changes are saved
automatically while the window remains open, including edits made during the first save. Check the status for save errors
or conflicts. Upload files from the computer using Files first. Invalid files
leave the current notebook available. The copy used internally by JupyterLite
has a random name and is scoped to the account in the browser.

JupyterLite executes notebook code with the website's browser permissions; do
not open untrusted notebooks as though they were isolated from your account.
Python packages and native processes are subject to Pyodide's browser limits.
On ordinary window close, the app requests cleanup of that window’s temporary
JupyterLite working copies and checkpoints. Cleanup is best effort: browser
crashes, interrupted startup, older copies or future JupyterLite storage-layout
changes can leave temporary data behind. Account files in My files are the
supported persistent copies. Physical-phone behavior
and all Jupyter extensions have not been verified.

Build inputs are described in `app.json`, `requirements-build.txt` and
`prepare.py`. Generated JupyterLite assets are build inputs rather than source.

A separate notice stays visible when My files detects that the linked notebook changed, is unavailable, or has conflicting copies. The notebook remains open; resolve conflicts in Files or save a separate copy. Automatic saves that retain a local conflict report that resolution is needed rather than claiming server sync. Detection depends on account-mirror synchronization. Local desktop, emulated-phone and 4K and live emulated-phone account tests cover conflicts during automatic saves, a conflict while a write is in progress, preserved copies, fresh-session recovery and listener cleanup.

The app uses a desktop confirmation before discarding notebook edits when opening another file. If the notebook changes while confirmation is open, it preserves the newer edit and asks the user to try again. Registered-account desktop, emulated-phone and 4K-sized tests cover cancellation, that race, the example, sync and fresh-session reopening.

Automated desktop mouse and emulated-phone touch tests cover the File menu, account save and sync, cancellation, reopening, two independent windows, and closing/reopening without duplicate commands. A simulated unavailable menu leaves the fallback controls usable. Physical touch and compatibility with future Jupyter upgrades remain unverified.

Each desktop Notebook window links one notebook to My files. If Jupyter has a
different temporary tab active, select the linked notebook before using its
My files save commands, or open a separate desktop Notebook window. If the tab
changes while the Save As dialog is open, the app cancels that save and asks
the user to try again. Automatic saves continue for the linked notebook even
when another tab has focus.

The local invalid-launch candidate opens an editable starter notebook if a
notebook opened from Files cannot be loaded. It keeps the error visible, leaves
the original file untouched and clears the invalid restore reference. Desktop,
emulated-phone and 4K account checks cover invalid and valid direct launches;
physical touch remains unverified.

Save As asks before replacing an existing notebook in My
files. Cancelling leaves both the saved file and current edits intact; a file
changed during confirmation is not overwritten. If the active notebook changes
while confirmation is open, the operation is cancelled. Local desktop,
emulated-phone and 4K account tests cover these cases, accepted replacement,
server sync and fresh-session reopening; the previous source rejected an
existing target without offering replacement. The notebook model edits in
these tests were made through Jupyter's API, and a separate desktop regression
ran the example with the real Pyodide kernel. A public phone-sized account test
also passed. Physical touch is unverified.

Open and Save As update the notebook window’s file identity. Local desktop and
emulated-phone checks cover opening the original and copy independently,
reusing the correct window and server sync. Physical touch remains unverified.

Closing the window while a notebook save is in progress asks for confirmation,
even if the notebook was clean when saving began. Edits made during the save
remain unsaved until the follow-up automatic save completes. A write already
sent to storage may still complete after the window closes.

The pinned JupyterLite 0.8.6 Pyodide proxy is patched during preparation to
accept both synchronous and asynchronous `Atomics.waitAsync` results. Before
this patch an observed fast response produced `value.then is not a function`
and left a kernel busy. A deterministic proxy test covers both return forms;
local desktop and emulated-phone two-window tests and a phone-sized lifecycle
run passed with the patch. These checks do not rule out other allocation or
resource-pressure failures; physical devices remain unverified.

A temporary read error or conflict while restoring a notebook retains its
reference and offers **Retry saved notebook** once the starter is ready. Retry
asks before discarding scratch edits; saving a scratch copy uses a distinct
suggested path when the original was `/Notebook.ipynb`. A successful save or
open switches the window to that file and clears the recovery target. Desktop and phone-sized account tests covered injected failure, cancellation, scratch save,
server sync and retry; physical touch is unverified. An immediate-close test
also observed a JupyterLite `Disposed` kernel error. Concurrent
notebook tests observed a Pyodide missing `decorator` error and an invalid-file
regression timed out; causes and wider lifecycle reliability remain open.
