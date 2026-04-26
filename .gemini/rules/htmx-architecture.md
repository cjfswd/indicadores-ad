# HTMX Architecture Rules

## Technology Roles — Strict Separation

### 1. Node.js TypeScript → Business Logic Only
- Database queries (Kysely)
- Validation, data transformation
- Audit logging, file uploads (multer)
- Returns data as JSON or renders EJS partials with data
- **Never** handles UI logic — no deciding what to show/hide, no looping for HTML

### 2. EJS Templates → Pure HTML Structure Only
- **Zero `<% %>` tags in any EJS file** — no variables, no loops, no conditionals
- `<%- include() %>` IS allowed — structural composition, not dynamic logic
- Pages: static shells with HTMX attributes
- Partials/components: reusable HTML fragments composed via `include()`
- Modals: static form structures with HTMX attributes

### 3. HTMX → All Dynamic Frontend Behavior
- **Loops**: `hx-get` fetches a list endpoint that returns all items as HTML
- **Conditionals**: server returns different HTML fragments; HTMX places them
- **Variables**: data values are embedded in the HTML returned by server endpoints
- **Content loading**: `hx-trigger="load"` fetches initial content on page load
- **Filtering**: `hx-get` + `hx-include` sends filter params, server returns filtered HTML
- **Mutations**: `hx-post` / `hx-put` submit data, server returns updated content
- **Modals**: `hx-get` fetches modal HTML into `#modal-container`
- **Notifications**: server sends `HX-Trigger: showToast` header

## Anti-Patterns
- ❌ `<% %>`, `<%= %>`, `<% if %>`, `<% forEach %>` in any EJS file
- ❌ UI logic in TypeScript routes (deciding what to render, looping HTML)
- ❌ Inline JS (`onclick`, `window.location`, `this.form.submit()`)
- ❌ Passing dynamic data to page-level `res.render()` calls

## Allowed
- ✅ `<%- include('./partial') %>` for structural composition
- ✅ Pure HTML + HTMX attributes (`hx-*`) in all EJS files
- ✅ TypeScript routes returning HTML via `res.render()` or `res.send()`
- ✅ Hardcoded HTML options in selects, static labels, static structure
