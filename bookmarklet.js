/**
 * AI Multi-Search — Bookmarklet source
 * ------------------------------------
 * This file is the readable source of truth for the bookmarklet.
 * The landing page (index.html) turns `AIMultiSearch.run` into a
 * complete `javascript:...` URL for the draggable link and copy button.
 *
 * The bookmarklet itself does NOT fetch remote scripts and does NOT use eval.
 *
 * Prefill support (as of project creation — providers can change this):
 *   - Claude:    URL prefill via https://claude.ai/new?q=... (does not auto-submit)
 *   - Gemini:    no reliable URL prefill → open app + clipboard
 *   - DeepSeek:  no reliable URL prefill → open chat + clipboard
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.1';

  /**
   * Everything the bookmarklet needs must live inside `run` so that
   * `run.toString()` produces a self-contained javascript: URL.
   */
  function run() {
    var STYLE_ID = 'ai-multi-search-styles';
    var ROOT_ID = 'ai-multi-search-root';
    var BOOKMARKLET_VERSION = '1.0.1';

    var PLATFORMS = [
      {
        id: 'claude',
        name: 'Claude',
        hostLabel: 'claude.ai',
        prefill: true
      },
      {
        id: 'gemini',
        name: 'Gemini',
        hostLabel: 'gemini.google.com',
        prefill: false
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        hostLabel: 'chat.deepseek.com',
        prefill: false
      }
    ];

    /** Explicit URL map so each platform can only open its own site. */
    function buildPlatformUrl(id, question) {
      if (id === 'claude') {
        return 'https://claude.ai/new?q=' + encodeURIComponent(question);
      }
      if (id === 'gemini') {
        return 'https://gemini.google.com/app';
      }
      if (id === 'deepseek') {
        return 'https://chat.deepseek.com/';
      }
      return '';
    }

    function getPlatformById(id) {
      for (var i = 0; i < PLATFORMS.length; i++) {
        if (PLATFORMS[i].id === id) return PLATFORMS[i];
      }
      return null;
    }

    function cleanText(value) {
      return String(value || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    function getSelectedText() {
      try {
        var selection = window.getSelection && window.getSelection();
        if (!selection) return '';
        return cleanText(selection.toString());
      } catch (err) {
        return '';
      }
    }

    function textFromUserNode(node) {
      if (!node) return '';
      var content =
        node.querySelector('.whitespace-pre-wrap') ||
        node.querySelector('.markdown') ||
        node.querySelector('[data-message-author-role="user"]') ||
        node;
      return cleanText(content.innerText || content.textContent || '');
    }

    /**
     * Extract the latest ChatGPT user question from the live DOM.
     * ChatGPT’s markup changes over time, so several selectors are tried.
     */
    function extractLatestChatGptQuestion() {
      var turnNodes = document.querySelectorAll('section[data-turn="user"]');
      if (turnNodes.length) {
        return textFromUserNode(turnNodes[turnNodes.length - 1]);
      }

      var roleNodes = document.querySelectorAll(
        '[data-message-author-role="user"]'
      );
      if (roleNodes.length) {
        return textFromUserNode(roleNodes[roleNodes.length - 1]);
      }

      var testIdNodes = document.querySelectorAll(
        '[data-testid*="user-message"], [data-testid*="conversation-turn"]'
      );
      if (testIdNodes.length) {
        return textFromUserNode(testIdNodes[testIdNodes.length - 1]);
      }

      return '';
    }

    function isLikelyChatGpt() {
      var host = (location.hostname || '').toLowerCase();
      return (
        host === 'chatgpt.com' ||
        host === 'www.chatgpt.com' ||
        host === 'chat.openai.com' ||
        host.endsWith('.chatgpt.com')
      );
    }

    function findQuestion() {
      var selected = getSelectedText();
      if (selected) {
        return { text: selected, source: 'selection' };
      }

      var latest = extractLatestChatGptQuestion();
      if (latest) {
        return { text: latest, source: 'chatgpt' };
      }

      return { text: '', source: 'none' };
    }

    function copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(
          function () {
            return true;
          },
          function () {
            return fallbackCopy(text);
          }
        );
      }
      return Promise.resolve(fallbackCopy(text));
    }

    function fallbackCopy(text) {
      try {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.cssText =
          'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
        document.body.appendChild(area);
        area.focus();
        area.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(area);
        return !!ok;
      } catch (err) {
        return false;
      }
    }

    function removeExistingUi() {
      var oldRoot = document.getElementById(ROOT_ID);
      if (oldRoot && oldRoot.parentNode) oldRoot.parentNode.removeChild(oldRoot);
      var oldStyle = document.getElementById(STYLE_ID);
      if (oldStyle && oldStyle.parentNode) {
        oldStyle.parentNode.removeChild(oldStyle);
      }
    }

    function injectStyles() {
      if (document.getElementById(STYLE_ID)) return;
      var style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent =
        '#' +
        ROOT_ID +
        '{all:initial;position:fixed;inset:0;z-index:2147483646;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;}' +
        '#' +
        ROOT_ID +
        ' *{box-sizing:border-box;}' +
        '#' +
        ROOT_ID +
        ' .ams-backdrop{position:absolute;inset:0;background:rgba(8,12,20,.55);backdrop-filter:blur(4px);}' +
        '#' +
        ROOT_ID +
        ' .ams-panel{position:relative;z-index:1;width:min(440px,calc(100vw - 32px));margin:12vh auto 0;background:#0f1724;color:#edf3f8;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:22px 22px 18px;box-shadow:0 24px 60px rgba(0,0,0,.45);}' +
        '#' +
        ROOT_ID +
        ' .ams-kicker{margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#7dd3c0;font-weight:700;}' +
        '#' +
        ROOT_ID +
        ' .ams-title{margin:0 0 8px;font-size:22px;line-height:1.2;font-weight:700;}' +
        '#' +
        ROOT_ID +
        ' .ams-sub{margin:0 0 14px;font-size:13px;line-height:1.5;color:#b7c4d1;}' +
        '#' +
        ROOT_ID +
        ' .ams-preview{margin:0 0 16px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:13px;line-height:1.45;max-height:110px;overflow:auto;white-space:pre-wrap;word-break:break-word;}' +
        '#' +
        ROOT_ID +
        ' .ams-list{display:flex;flex-direction:column;gap:8px;margin:0 0 14px;}' +
        '#' +
        ROOT_ID +
        ' .ams-option{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);}' +
        '#' +
        ROOT_ID +
        ' .ams-option:hover{border-color:rgba(125,211,192,.45);}' +
        '#' +
        ROOT_ID +
        ' .ams-option-main{flex:1;min-width:0;cursor:pointer;display:flex;align-items:flex-start;gap:10px;}' +
        '#' +
        ROOT_ID +
        ' .ams-option input{margin-top:3px;}' +
        '#' +
        ROOT_ID +
        ' .ams-option strong{display:block;font-size:14px;}' +
        '#' +
        ROOT_ID +
        ' .ams-option .ams-host{display:block;font-size:11px;color:#7dd3c0;margin-top:2px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}' +
        '#' +
        ROOT_ID +
        ' .ams-option .ams-hint{display:block;font-size:12px;color:#9aacbc;margin-top:2px;}' +
        '#' +
        ROOT_ID +
        ' .ams-btn-open{appearance:none;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#edf3f8;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;}' +
        '#' +
        ROOT_ID +
        ' .ams-btn-open:hover{border-color:rgba(125,211,192,.55);background:rgba(125,211,192,.12);}' +
        '#' +
        ROOT_ID +
        ' .ams-note{margin:0 0 14px;font-size:12px;line-height:1.45;color:#9aacbc;}' +
        '#' +
        ROOT_ID +
        ' .ams-actions{display:flex;gap:8px;flex-wrap:wrap;}' +
        '#' +
        ROOT_ID +
        ' .ams-btn{appearance:none;border:0;border-radius:999px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;}' +
        '#' +
        ROOT_ID +
        ' .ams-btn-primary{background:#7dd3c0;color:#082018;}' +
        '#' +
        ROOT_ID +
        ' .ams-btn-primary:disabled{opacity:.45;cursor:not-allowed;}' +
        '#' +
        ROOT_ID +
        ' .ams-btn-ghost{background:transparent;color:#edf3f8;border:1px solid rgba(255,255,255,.18);}' +
        '#' +
        ROOT_ID +
        ' .ams-status{margin:12px 0 0;font-size:12px;line-height:1.45;min-height:1.2em;}' +
        '#' +
        ROOT_ID +
        ' .ams-status.ok{color:#7dd3c0;}' +
        '#' +
        ROOT_ID +
        ' .ams-status.err{color:#ff8f7a;}' +
        '#' +
        ROOT_ID +
        ' .ams-warn{margin:0 0 14px;padding:10px 12px;border-radius:12px;background:rgba(255,143,122,.12);border:1px solid rgba(255,143,122,.35);color:#ffd2c8;font-size:12px;line-height:1.45;}';
      document.documentElement.appendChild(style);
    }

    function showErrorDialog(message) {
      removeExistingUi();
      injectStyles();
      var root = document.createElement('div');
      root.id = ROOT_ID;
      root.innerHTML =
        '<div class="ams-backdrop" data-ams-close="1"></div>' +
        '<div class="ams-panel" role="dialog" aria-modal="true" aria-label="AI Multi-Search">' +
        '<p class="ams-kicker">AI Multi-Search</p>' +
        '<h2 class="ams-title">Nothing to reuse</h2>' +
        '<p class="ams-sub"></p>' +
        '<div class="ams-actions">' +
        '<button type="button" class="ams-btn ams-btn-primary" data-ams-close="1">Got it</button>' +
        '</div></div>';
      root.querySelector('.ams-sub').textContent = message;
      root.addEventListener('click', function (event) {
        if (event.target && event.target.getAttribute('data-ams-close')) {
          removeExistingUi();
        }
      });
      document.documentElement.appendChild(root);
    }

    function openPlatforms(question, selectedIds, statusEl) {
      var opened = [];
      var blocked = [];
      var details = [];

      for (var i = 0; i < selectedIds.length; i++) {
        var id = selectedIds[i];
        var platform = getPlatformById(id);
        var url = buildPlatformUrl(id, question);
        if (!platform || !url) continue;

        // Unique window name per platform so tabs cannot reuse the wrong site.
        var win = window.open(url, 'ams_' + id);
        if (win) {
          opened.push(platform.name);
          details.push(platform.name + ' → ' + platform.hostLabel);
        } else {
          blocked.push(platform.name);
        }
      }

      var parts = [];
      if (details.length) {
        parts.push('Opened: ' + details.join('; ') + '.');
      }
      if (blocked.length) {
        parts.push(
          'Blocked by the browser: ' +
            blocked.join(', ') +
            '. Allow pop-ups for this site, then try again.'
        );
        statusEl.className = 'ams-status err';
      } else {
        statusEl.className = 'ams-status ok';
      }

      return {
        opened: opened,
        blocked: blocked,
        message: parts.join(' ')
      };
    }

    function launchIds(question, ids, statusEl, triggerBtn) {
      if (!ids.length) {
        statusEl.className = 'ams-status err';
        statusEl.textContent = 'Select at least one platform.';
        return;
      }

      if (triggerBtn) triggerBtn.disabled = true;
      statusEl.className = 'ams-status';
      statusEl.textContent = 'Copying and opening…';

      copyToClipboard(question).then(function (copied) {
        var result = openPlatforms(question, ids, statusEl);
        var copyMsg = copied
          ? 'Question copied to clipboard.'
          : 'Could not copy automatically — select the preview text and copy manually.';
        statusEl.textContent = copyMsg + ' ' + result.message;
        if (triggerBtn) triggerBtn.disabled = false;

        if (result.opened.length && !result.blocked.length) {
          setTimeout(removeExistingUi, 1400);
        }
      });
    }

    function showChooser(question, source) {
      removeExistingUi();
      injectStyles();

      var root = document.createElement('div');
      root.id = ROOT_ID;

      var sourceLabel =
        source === 'selection'
          ? 'Using your highlighted text.'
          : 'Using the latest ChatGPT user question.';

      var optionsHtml = PLATFORMS.map(function (platform) {
        var hint = platform.prefill
          ? 'URL prefill when supported. Paste if needed.'
          : 'Blank chat — paste from clipboard.';
        return (
          '<div class="ams-option" data-platform-row="' +
          platform.id +
          '">' +
          '<label class="ams-option-main">' +
          '<input type="checkbox" name="ams-platform" value="' +
          platform.id +
          '">' +
          '<span><strong>' +
          platform.name +
          '</strong>' +
          '<span class="ams-host">' +
          platform.hostLabel +
          '</span>' +
          '<span class="ams-hint">' +
          hint +
          '</span></span></label>' +
          '<button type="button" class="ams-btn-open" data-ams-open="' +
          platform.id +
          '">Open</button>' +
          '</div>'
        );
      }).join('');

      var hostWarning = '';
      if (!isLikelyChatGpt() && source !== 'selection') {
        hostWarning =
          '<div class="ams-warn">This page does not look like ChatGPT. Highlight the question text first, or open chatgpt.com and try again.</div>';
      }

      root.innerHTML =
        '<div class="ams-backdrop" data-ams-close="1"></div>' +
        '<div class="ams-panel" role="dialog" aria-modal="true" aria-label="AI Multi-Search">' +
        '<p class="ams-kicker">AI Multi-Search v' +
        BOOKMARKLET_VERSION +
        '</p>' +
        '<h2 class="ams-title">Reuse this question</h2>' +
        '<p class="ams-sub">' +
        sourceLabel +
        ' Use Open on one site, or check several and Open selected.</p>' +
        hostWarning +
        '<div class="ams-preview"></div>' +
        '<div class="ams-list">' +
        optionsHtml +
        '</div>' +
        '<p class="ams-note">Your question is copied to the clipboard. Claude may prefill via URL; Gemini and DeepSeek need paste. Nothing is auto-submitted.</p>' +
        '<div class="ams-actions">' +
        '<button type="button" class="ams-btn ams-btn-primary" data-ams-go="1">Open selected</button>' +
        '<button type="button" class="ams-btn ams-btn-ghost" data-ams-close="1">Cancel</button>' +
        '</div>' +
        '<p class="ams-status" aria-live="polite"></p>' +
        '</div>';

      root.querySelector('.ams-preview').textContent = question;

      var statusEl = root.querySelector('.ams-status');
      var goBtn = root.querySelector('[data-ams-go]');

      root.addEventListener('click', function (event) {
        var target = event.target;
        if (!target) return;

        if (target.getAttribute('data-ams-close')) {
          removeExistingUi();
          return;
        }

        var openId = target.getAttribute('data-ams-open');
        if (openId) {
          event.preventDefault();
          event.stopPropagation();
          launchIds(question, [openId], statusEl, target);
        }
      });

      goBtn.addEventListener('click', function () {
        var checked = root.querySelectorAll(
          'input[name="ams-platform"]:checked'
        );
        var ids = [];
        for (var i = 0; i < checked.length; i++) {
          ids.push(checked[i].value);
        }
        launchIds(question, ids, statusEl, goBtn);
      });

      document.documentElement.appendChild(root);
    }

    var found = findQuestion();
    if (!found.text) {
      showErrorDialog(
        'No question found. Highlight your prompt text, or make sure you are on chatgpt.com with at least one user message visible, then try the bookmarklet again.'
      );
      return;
    }

    showChooser(found.text, found.source);
  }

  function getBookmarkletHref() {
    var source = '(' + run.toString() + ')();';
    return 'javascript:' + encodeURIComponent(source);
  }

  global.AIMultiSearch = {
    version: VERSION,
    run: run,
    getBookmarkletHref: getBookmarkletHref
  };
})(typeof window !== 'undefined' ? window : this);
