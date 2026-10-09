# AI Multi-Search

**One question. Multiple AIs.**

A beginner-friendly browser bookmarklet that reuses your ChatGPT questions on **Claude**, **Gemini**, and **DeepSeek**. The project is plain HTML, CSS, and vanilla JavaScript—no React, Node.js, API keys, backend, or npm dependencies.

## What it does

1. You click the **AI Multi-Search** bookmark while on [chatgpt.com](https://chatgpt.com).
2. It prefers any **highlighted text**; otherwise it reads the **latest user question** from the page.
3. A small dialog lets you choose one or more platforms.
4. Selected sites open in **new tabs**.
5. The question is copied to your **clipboard** for easy pasting.

**URL prefill** is used only where it is currently reasonably reliable:

| Platform | Opens | Prefill |
| --- | --- | --- |
| Claude | `claude.ai/new` | `?q=` when the site still honors it (does **not** auto-submit) |
| Gemini | `gemini.google.com/app` | Clipboard only (no reliable public URL prefill) |
| DeepSeek | `chat.deepseek.com` | Clipboard only (no reliable native URL prefill) |

Providers can change URL behavior at any time. Always review the prompt before sending.

## Files

| File | Role |
| --- | --- |
| `index.html` | Landing page (install UI, instructions, privacy) |
| `bookmarklet.js` | Readable bookmarklet source; builds the `javascript:` URL for the page |
| `README.md` | This guide |

The draggable bookmark on the landing page contains the **full executable JavaScript**, not a link to an external file. `index.html` loads `bookmarklet.js` only to assemble that `javascript:` URL for visitors. The bookmarklet itself does **not** `fetch` remote scripts and does **not** use `eval`.

## Install the bookmarklet

1. Open the landing page (locally or on GitHub Pages).
2. Show the bookmarks bar (`Cmd/Ctrl + Shift + B` in Chrome).
3. Drag **AI Multi-Search** onto the bar, **or** click **Copy Bookmarklet** and paste into a new bookmark’s URL field.
4. On ChatGPT, click the bookmark, pick platforms, and paste where needed.

## Test locally (before trusting it in Chrome)

Do **not** assume the bookmarklet works until you verify it in Chrome.

### 1. Serve the site

From this folder:

```bash
# Python 3
python3 -m http.server 8080
```

Or:

```bash
# Node (if you have npx)
npx --yes serve -p 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Opening `index.html` via `file://` may work, but a local HTTP server is more reliable for script loading and clipboard permissions.

### 2. Check the landing page

- Confirm the page looks fine on desktop and a narrow window.
- Click **Copy Bookmarklet** and paste into a text editor—you should see a long `javascript:(...` string.
- Drag the bookmarklet to the bookmarks bar.

### 3. Test the bookmarklet on ChatGPT (Chrome)

1. Sign in at [https://chatgpt.com](https://chatgpt.com) and start (or open) a chat with at least one user message.
2. Click **AI Multi-Search** on the bookmarks bar.
3. Confirm the dialog shows the latest question.
4. Highlight a different phrase, click the bookmarklet again, and confirm it prefers the selection.
5. Open Claude only → confirm a new tab and clipboard contents; check whether Claude’s box prefills (if not, paste).
6. Open Gemini and DeepSeek → confirm tabs open and that pasting works.
7. Deny pop-ups once, then confirm the bookmarklet shows a clear blocked-pop-up message; allow pop-ups and retry.

### 4. Failure cases to try

- Click the bookmarklet on a non-ChatGPT page with nothing selected → expect a clear “no question” message.
- Block pop-ups → expect a message naming which tabs were blocked.

## Browser security limitations

- **Same-origin policy:** A bookmarklet runs as part of the *current* page. On ChatGPT it can read ChatGPT’s DOM. It cannot read Claude/Gemini/DeepSeek tabs, and those sites cannot be scripted from ChatGPT.
- **No remote code in the bookmarklet:** For safety and offline reliability, the bookmarklet is self-contained. It does not download scripts from the network when you click it.
- **Pop-up blocking:** Opening several tabs usually requires a direct user gesture. Browsers may still block `window.open` until the site is allowed to create pop-ups.
- **Clipboard permissions:** Some browsers restrict clipboard writes outside a clear user gesture or on `file://` pages. The dialog still shows the question so you can copy manually.
- **Fragile DOM scraping:** ChatGPT’s HTML changes. If auto-detection fails, **highlight the question** first—selection always wins.
- **URL length:** Very long prompts may exceed URL limits for Claude’s `?q=` prefill; clipboard paste still works.

## Repository

Source: [github.com/charliezhou1/AI_multi_search](https://github.com/charliezhou1/AI_multi_search)

## GitHub Pages

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment**
3. Source: **Deploy from a branch**
4. Branch: `main` (or `master`), folder: `/ (root)`
5. Open [https://charliezhou1.github.io/AI_multi_search/](https://charliezhou1.github.io/AI_multi_search/) and install the bookmarklet from there.

Visitors should install from the **published HTTPS page**, not from a raw GitHub file URL, so the bookmarklet link is generated correctly.

## Privacy

- No backend, accounts, analytics, or API keys in this project.
- Question text stays in your browser until you open a destination site or paste from the clipboard.
- Destination AI products apply their own terms and privacy policies.

## License

MIT — use and adapt freely.
