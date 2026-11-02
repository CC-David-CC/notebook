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

A later isolated local rerun passed the invalid-file regression separately on
both desktop and emulated-phone layouts, and two account recovery workflows
passed concurrently. A three-window open/close probe per layout also passed;
in that probe the kernel was not yet connected when each window closed. These
runs did not reproduce the earlier intermittent errors and do not establish that
other kernel-startup stages, physical devices, or heavier concurrency are safe.
The local preview logged a client connection reset during browser shutdown.

Opening or saving a notebook updates the desktop window title to the current
My files filename, including after Save As. Desktop and emulated-phone account
tests cover switching between an original and a separately saved copy; physical
touch has not been verified.

When a student edits while choosing a file, the desktop asks once before
replacing those edits. If the notebook changes again during confirmation or
loading, it still protects the newer edit. Local registered-account desktop
and emulated-phone tests ran the actual Python mean, saved and synced it, then
edited during file selection and confirmed that one discard action opens the
saved notebook. Physical touch remains unverified.

To use a CSV or other account file in Python, choose **File → Import data from My files**. Choose a working filename to create a browser-local copy; an existing Jupyter file is never intentionally overwritten by import. The **Imported data copies** panel shows the filename to use with `open()`. The account file is unchanged. Use **File → Save working file to My files** to copy an output file back; choosing an existing target asks before replacing it, and concurrent file changes are guarded. These are explicit snapshots, not a mounted drive or automatic synchronization. Working copies remain in the browser’s account-scoped Jupyter storage until removed there or browser data is cleared. Imports use the browser Web Locks API to coordinate simultaneous copies; concurrent changes made directly by Python or another tool are not locked. On another device, reimport the account file using the same working filename so notebook code still applies. Python-created working files also remain browser-local; save any output you need to My files. The 128 MiB file limit applies, but large base64 conversions can require substantially more browser memory.

Import rechecks the local source version after waiting for the import lock and
again before creating the Jupyter working copy. If it changed or developed a
conflict, select it again. The final check and Jupyter save use separate stores
and are not atomic; a change afterward can still produce an older snapshot.
Edits on another device that have not reached this browser can also be absent.
Local registered-account desktop and emulated-phone tests changed a CSV while
the filename dialog was open and while its import lock was held, checked that
neither stale copy was created, then reimported it, ran real Python, saved and
synced an output, and reopened it in a fresh browser. Physical touch and every
possible timing remain unverified.

Python outputs inside workspace folders can be saved by entering a relative path,
for example `results/mean.csv`. The suggested My files destination uses the
output's filename; choose a different destination if needed. Absolute paths,
parent traversal and Jupyter drive prefixes are rejected. Export takes a
snapshot when the working file is read, so later Python writes require another
export. Workspace folders remain browser-local and are not synchronized.
In an isolated local registered-account test, desktop and emulated-phone
sessions imported CSV data, used the real Pyodide kernel to calculate a mean
and write a nested output, saved it to My files, checked invalid paths and
cancelled replacement, and reopened the saved output in a fresh browser
session. Physical-phone behavior has not been verified.

A registered-account desktop and phone-sized browser test also opened a saved
notebook, selected Pyodide, ran its actual calculation, and checked that the
cell's output and execution count automatically saved, synchronized, and
reopened in a fresh browser session. Physical-phone input and every output
format are not covered by this test.

If an automatic My files write fails with an `AbortError`, `NetworkError` or
`TimeoutError`, the notebook retries up to three times with increasing delays.
After those retries, or after a non-transient error such as quota exhaustion,
automatic saves pause and the notebook stays marked unsaved; use **File → Save
to My files** to try again. A successful save resumes autosaving. This retry is
for the local My files write; server synchronization is a separate process and
is not guaranteed by the retry message. Local registered-account desktop and
emulated-phone tests inject transient and persistent write failures, verify the
retry cap and quota stop, manually recover, sync and reopen and run real Python. One earlier phone-sized run encountered a
kernel stuck in an unknown state; its cause remains unproven. Two fresh repetitions
of that scenario passed real Python, and separate desktop and emulated-phone
two-window tests each passed two launch/run/close cycles with independent kernel
state. The regression bounds execution waiting to 60 seconds. These successes do
not establish that the intermittent stall is fixed. Physical phones and real
browser quota exhaustion remain unverified.

### Make a plot from a CSV file

For a CSV in My files with a `value` column, choose **File → Import data from
My files** and name the working copy `measure.csv`. In a Python cell, run:

```python
import csv
from pathlib import Path
import matplotlib.pyplot as plt

with open('measure.csv', newline='') as source:
    values = [float(row['value']) for row in csv.DictReader(source)]
Path('results').mkdir(exist_ok=True)
plt.plot(values, marker='o')
plt.ylabel('Measurement')
plt.savefig('results/plot.png')
plt.show()
```

Use **File → Save working file to My files** and enter `results/plot.png` to
save a snapshot in My files. Saving the notebook alone does not save that
separate image, and editing the original CSV does not update its working copy.

`tests/notebook-plot-account-review.test.mjs` exercises CSV import, real
Matplotlib execution through the browser's Pyodide kernel, and PNG export in
isolated registered desktop and phone-sized browser sessions. It verifies the
PNG signature and byte-for-byte browser/server and fresh-session hashes,
invalid output paths, and canceling replacement. It does not check the image's
visual appearance, cell-editor input or a physical phone.
Run it only against an isolated loopback preview by setting `CODI_TEST_URL`;
`CODI_TEST_CDP` selects the Chrome DevTools endpoint (default port 19255).
The isolated preview's test accounts and data should be removed after the run.

On narrow notebook windows, a focused layout hides Jupyter's menu, sidebars and
small notebook toolbar and offers touch-sized **Run cell**, **Add cell**, and
**More controls**. More controls restores the native Jupyter menu and activity
bars, including File → My files commands; closing it returns focus to the
notebook. Resizing across the narrow threshold restores the desktop layout and
previously open side panels. The layout uses JupyterLab shell APIs and a frame
resize observer; if those APIs are unavailable it leaves the native interface
in place. Emulated phone, desktop and 4K tests run a real Matplotlib cell,
check rendered chart pixels and explicit notebook save, exercise touch controls
and rotation, and close the notebook and its worker. Physical phones and future
JupyterLab layout/API changes are not covered.

The currently live baseline does not include the `ipywidgets` Python
package: an isolated emulated-phone Python run returned `ModuleNotFoundError`.
Its placeholder `widgetsnbextension` files alone do not provide interactive
widgets. The research candidate below adds the Python dependency and compatible
frontend manager; it has not yet been deployed.

The focused-layout test verifies single-window iframe/kernel-worker cleanup;
it does not establish multi-window kernel isolation. A separate widget-runtime
research test observed two host notebook windows restoring an unintended third
background notebook/kernel. Per-window workspace/restoration isolation remains
an open lifecycle issue and is being investigated separately.
### Interactive widgets (research candidate)

The local Pyodide package lock includes `ipywidgets` 8.1.8 and `comm` 0.2.3.
The JupyterLab widget manager 5.0.15 comes from `jupyterlab_widgets` 3.0.16.
Each fresh kernel can use `import ipywidgets` without a separate install;
packages and extension files are served by this site. The preparer verifies the
wheel hashes and checks packaged manager scripts against the pinned wheel.
Notices for the two widget wheels, including the manager's bundled JavaScript
licenses, are included with this app.

This applies only to the pinned packages included in the catalog. Other Python
packages may try PyPI, subject to browser network and security policy. A browser
that has never loaded the site still needs a connection to obtain its assets;
offline startup and persistence of cached assets have not been qualified.
Physical-device testing and release qualification remain outstanding.
In an isolated signed-account preview, a Chromium desktop test exercised two
notebook windows with separate current kernel IDs and slider state. Opening the
second window also restored the first notebook as a background panel with its
own third kernel; this is an unresolved resource and user-interface issue.
Closing the second window preserved the first widget. A combined responsive
candidate also passed an emulated-phone slider touch and Python button callback.
