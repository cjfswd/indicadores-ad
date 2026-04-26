# HTMX + EJS Architecture Rules

> Canonical reference for the Indicadores AD frontend architecture.
> **Every contributor and AI agent MUST follow these rules.**

## 1. No HTML in TypeScript

View routes must **never** concatenate or build HTML strings in `.ts` files.
All HTML lives in `.ejs` files under `backend/src/views/`.

```
❌  res.send(`<div class="card">${esc(name)}</div>`)
✅  res.render('partials/card', { name, layout: false })
```

## 2. EJS for Iteration & Conditionals

Use native EJS tags for dynamic rendering:

| Need | EJS Syntax |
|------|-----------|
| Escaped output | `<%= value %>` |
| Raw HTML (trusted) | `<%- value %>` |
| Loop | `<% for (const item of list) { %> ... <% } %>` |
| Conditional | `<% if (condition) { %> ... <% } %>` |

**Never** create `esc()`, `when()`, or similar wrapper functions in TypeScript for HTML generation.

## 3. HTMX for All Interactivity

- All dynamic behavior uses `hx-*` attributes.
- **No** `<script>` tags in partials — global utilities (`showToast`, `closeModal`, `toggleTheme`, `toggleSidebar`) live only in `layouts/main.ejs`.
- **No** `onclick`, `onchange`, or any inline DOM event handlers — use `hx-on:*` instead.

```html
❌  <button onclick="doSomething()">
✅  <button hx-on:click="doSomething()">

❌  <select onchange="update()">
✅  <select hx-get="/endpoint" hx-trigger="change" hx-target="#target">
```

## 4. View Route Pattern

### Full pages (browser navigation)
```ts
res.render('pageName', { title: 'Page Title', currentPath: '/path' })
```
Uses `layouts/main.ejs` automatically via `express-ejs-layouts`.

### HTMX fragments (partial swap)
```ts
res.render('partials/fragment-name', { data, layout: false })
```
`layout: false` prevents the layout wrapper — returns raw HTML fragment for `hx-swap`.

### Modals (loaded into `#modal-container`)
```ts
res.render('modals/modal-name', { data, layout: false })
```

## 5. Directory Structure

```
views/
├── layouts/
│   └── main.ejs            # App shell (sidebar, toast, global <script>)
├── partials/
│   ├── sidebar.ejs          # Navigation sidebar
│   ├── pacientes-list.ejs   # Grouped patient list
│   ├── registro-detail.ejs  # Monthly record detail
│   ├── dashboard-content.ejs# Dashboard charts + KPIs
│   ├── metas-table.ejs      # Goals table
│   ├── auditoria-table.ejs  # Audit log cards + pagination
│   └── semaforo-grid.ejs    # Traffic light indicators
├── modals/
│   ├── paciente-form.ejs    # Create/edit patient
│   ├── paciente-desativar.ejs
│   ├── paciente-excluir.ejs
│   ├── evento-form.ejs
│   ├── evento-excluir.ejs
│   ├── meta-form.ejs
│   └── auditoria-reverter.ejs
├── dashboard.ejs            # Page shell (hx-get loads content)
├── registros.ejs
├── pacientes.ejs
├── metas.ejs
├── auditoria.ejs
└── login.ejs                # Standalone (layout: false)
```

## 6. Shared Helpers

Helper functions and constants are registered as `app.locals` in
`middleware/view-helpers.middleware.ts` and available in **every** EJS template
without explicit passing:

- `fmtDate(dateStr)` — format ISO date to `dd/mm/yyyy`
- `fmtTs(timestamp)` — format ISO timestamp to `dd/mm/yyyy HH:mm`
- `calcularIdade(dataNasc)` — calculate age from birth date
- `MESES`, `MESES_CURTOS` — month name arrays
- `INDICADOR_LABELS` — indicator code → name map
- `TIPO_EVENTO_LABELS` — event type → label map
