---
trigger: always_on
glob:
description:
---

# HTMX 2.x Reference (Antigravity Rules)

High-density, token-optimized context for AI generation. Defines all core `hx-` attributes, HTTP headers, and DOM events for zero-JS declarative UI.

## Core Attributes (`hx-*`)

**Requests**
* `hx-get`, `hx-post`, `hx-put`, `hx-patch`, `hx-delete`: Issue HTTP request to URL.

**Targeting & Swapping**
* `hx-target="<sel>"`: Element to load response into. Extended syntax: `this`, `closest <sel>`, `next <sel>`, `previous <sel>`, `find <sel>`.
* `hx-swap="<style>"`: Swap strategy: `innerHTML` (default), `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `delete`, `none`.
  * *Modifiers* (colon-separated, e.g., `swap:100ms`): `transition:true|false`, `swap:<time>`, `settle:<time>`, `ignoreTitle:true`, `scroll:top|bottom`, `show:top|bottom`, `focus-scroll:true|false`.
* `hx-swap-oob="true|<style>"`: (Server response) Swap directly into matching ID, bypassing target.
* `hx-select="<sel>"`: Select subset of response HTML to swap.
* `hx-select-oob="<sel>"`: Select subset of response for OOB swap.
* `hx-preserve="true"`: Preserve element by ID across swaps.

**Triggers & Sync**
* `hx-trigger="<event>"`: Event triggering request (default: `click`, `change`, `submit`).
  * *Modifiers*: `once`, `changed`, `delay:<time>`, `throttle:<time>`, `from:<sel>`.
  * *Special*: `load`, `revealed`, `intersect` (`root:<sel>`, `threshold:<float>`), `every <time>` (polling).
  * *Filters*: `[jsCondition]` (e.g., `click[ctrlKey]`). Multiple triggers are comma-separated.
* `hx-sync="<sel>:<strat>"`: Coordinate concurrent requests. Strategies: `drop`, `abort`, `replace`, `queue`.

**Parameters & Data**
* `hx-include="<sel>"`: Include values of matching elements.
* `hx-params="<list>"`: Filter params sent (`*`, `none`, `not <list>`, `<list>`).
* `hx-vals="<json>"`: Static JSON values. Prefix `js:` to evaluate dynamically.
* `hx-vars="<list>"`: Dynamic JS variables (deprecated, use `hx-vals`).
* `hx-encoding="multipart/form-data"`: Use for file uploads.

**UI, Indicators & Prompts**
* `hx-indicator="<sel>"`: Adds `htmx-request` class during flight (controls opacity).
* `hx-disabled-elt="<sel>"`: Adds `disabled` attribute during flight.
* `hx-confirm="<msg>"`: Shows `window.confirm()` before request.
* `hx-prompt="<msg>"`: Shows `window.prompt()`, sent via `HX-Prompt` header.

**History & Enhancements**
* `hx-boost="true"`: AJAX enhancement for standard `<a>` and `<form>`.
* `hx-push-url="true|false|<url>"`: Push URL to history stack.
* `hx-replace-url="true|false|<url>"`: Replace URL in history.
* `hx-history="false"`: Prevent `localStorage` history caching.
* `hx-history-elt="<sel>"`: Element to snapshot for history (default `body`).

**Scripting & Config**
* `hx-ext="<list>"`: Enable extensions (e.g., `ws`, `sse`, `idiomorph`).
* `hx-on:<event>="<js>"`: Inline handlers (e.g., `hx-on:click`, `hx-on:htmx:after-request`).
* `hx-disable`: Disable HTMX processing for element and children.
* `hx-inherit="<attrs>"` / `hx-disinherit="<attrs>"`: Control attribute inheritance.
* `hx-validate="true"`: Force HTML5 validation before request on non-forms.
* `hx-headers="<json>"`: Custom HTTP headers.

---

## HTTP Headers

**Request Headers (Client to Server)**
* `HX-Request`: `true`
* `HX-Trigger`: ID of trigger element
* `HX-Trigger-Name`: Name of trigger
* `HX-Target`: ID of target
* `HX-Prompt`: User prompt value
* `HX-Current-URL`: Current browser URL
* `HX-Boosted`: `true` if boosted
* `HX-History-Restore-Request`: `true` on cache miss restore

**Response Headers (Server to Client)**
* `HX-Location`: Client redirect without full reload
* `HX-Push-Url` / `HX-Replace-Url`: Update browser history
* `HX-Redirect`: Full client redirect
* `HX-Refresh`: `true` forces full reload
* `HX-Reswap`: Overrides `hx-swap`
* `HX-Retarget`: Overrides `hx-target`
* `HX-Reselect`: Overrides `hx-select`
* `HX-Trigger` / `HX-Trigger-After-Swap` / `HX-Trigger-After-Settle`: Trigger client events

---

## Events (`htmx:*`)
*Dispatched in both camelCase and kebab-case. Catch via `hx-on` or `addEventListener`.*

**Request Lifecycle**
* `htmx:trigger`: Trigger condition met.
* `htmx:configRequest`: Hook to modify `detail.parameters` or `detail.headers`.
* `htmx:beforeRequest`: Before XHR send. Cancellable via `preventDefault()`.
* `htmx:beforeSend`: Immediately before `send()`. Uncancellable.
* `htmx:afterRequest`: Request completed (success or network error).
* `htmx:abort`: *(Listen-only)* Send to element to abort in-flight request.
* `htmx:timeout`: Request timeout hit.

**Swap & DOM**
* `htmx:beforeSwap`: Before content swap. Cancellable. Modify `detail.shouldSwap`, `detail.target`, or `detail.isError` (useful to force swaps on 4xx/5xx).
* `htmx:afterSwap`: After DOM injection.
* `htmx:afterSettle`: After CSS transitions settle.
* `htmx:beforeTransition`: Before View Transitions wrap. Cancellable.
* `htmx:load`: New node loaded into DOM.
* `htmx:beforeProcessNode` / `htmx:afterProcessNode`: Hooks during attribute parsing.
* `htmx:beforeCleanupElement`: Before element disabled/removed.
* `htmx:oobBeforeSwap` / `htmx:oobAfterSwap` / `htmx:oobErrorNoTarget`: OOB swap hooks.

**Validation, Security & UX**
* `htmx:validation:validate` / `failed` / `halted`: HTML5 validation hooks.
* `htmx:validateUrl`: URL request hook. Cancellable.
* `htmx:confirm`: Async custom dialogs (call `detail.issueRequest()` to resume). Cancellable.
* `htmx:prompt`: Triggered after `hx-prompt`.

**History**
* `htmx:beforeHistorySave` / `htmx:beforeHistoryUpdate` / `htmx:pushedIntoHistory` / `htmx:replacedInHistory`
* `htmx:historyCacheHit` / `htmx:historyCacheMiss` / `htmx:historyCacheMissLoad` / `htmx:historyCacheMissLoadError` / `htmx:historyRestore` / `htmx:historyCacheError`

**Errors & XHR Wrappers**
* `htmx:responseError`: HTTP 4xx/5xx.
* `htmx:sendError`: Network failure.
* `htmx:swapError` / `htmx:targetError` / `htmx:onLoadError`
* `htmx:sseError` / `htmx:noSSESourceError`
* `htmx:xhr:loadstart` / `loadend` / `progress` / `abort`: Native XHR wrappers.