# Béute Pro production admin audit

**Verdict: NOT production-ready.** Resolve the Angular `NG0200` circular dependency during restored-session HTTP initialization first, then repeat the blocked lifecycle tests.

Date: **17 October 2026, Asia/Karachi**. Scope: live production admin and the signed-in storefront; local source review for preparation and diagnosis. Audit-only: no application code edits, commits, pushes or deployment.

The initial credential placeholder was resolved when the user signed in as `admin@beutepro.com`. This report supersedes the preliminary access-blocked report. Chrome was unavailable through the browser connection, so the available real Codex In-app Browser was used. Admin captures used the existing narrow viewport (approximately 490–505 px wide); the new storefront tab used the browser's normal wider viewport. No explicit viewport override was applied. Full desktop admin coverage is not claimed.

## 1. Executive summary

The admin initially rendered the dashboard, empty Orders and Revenue screens, an 18-product catalogue, and a successful header-only Orders CSV download. Product search then remained in a loading state across repeated inspections. Following full navigation/session restoration, the dashboard and most data-dependent screens failed; **34 captured console entries across 10 distinct message prefixes contain `NG0200`**. The signed-in storefront shop also failed. The top three issues are **(1)** the restored-session dependency cycle breaking HTTP-backed functionality, **(2)** failed reads being presented as empty catalogues/inventory/coupons/rates or blank editable settings, and **(3)** incomplete Arabic translation and responsive admin controls: English labels remain in Arabic mode, while product Edit/Delete controls have zero visible size at the audited narrow viewport. Product/category/coupon persistence and deletion were not tested after the read failures made baseline and cleanup verification unreliable. No dummy production record was created; local drafts were discarded. A provider refresh was attempted as explicitly requested, failed with `NG0200`, and public rates plus their timestamp were unchanged afterward.

Legend: ✅ observed success; ❌ reproduced failure; ⚠️ partial, blocked or unavailable. “Loads” means data as well as the shell. Error counts below count distinct failed scenarios, not repeated console entries; localization/layout findings are described separately.

| Screen | Loads | Interactions | Errors | Notes |
|---|---|---|---|---|
| Dashboard | ✅ initially → ❌ after restoration | ⚠️ | 1 | Initial zero orders/revenue; later “The dashboard didn't load”; refresh still fails |
| Orders | ✅ initially | ⚠️ | 0 observed initially | Status selectors/search/CSV exercised; no orders for detail, sort, pagination or bulk writes |
| Order detail | ⚠️ unavailable | ⚠️ | Not observed | No real order available in initial list; no order created |
| Revenue | ✅ initially | ✅ initial refresh | 0 observed initially | Zero totals and empty top products; not revalidated after later runtime failure |
| Products | ✅ 18 initially → ❌ | ❌ | 3 | Search stays loading; later read fails; export fails |
| New product | ⚠️ form renders | ⚠️ local draft only | 1 | Required category has no options; creation blocked |
| Edit product/media | ⚠️ blocked | ⚠️ | Not observed | No dummy persisted; no real product opened/edited |
| Categories | ❌ | ⚠️ local draft only | 1 | `NG0200`; “No categories yet” despite public API returning five |
| Inventory | ❌ | ❌ filters cannot load data | 1 | `NG0200`; misleading zero/empty state |
| Customers | ❌ | ❌ search/retry | 1 | Explicit load error; no account opened |
| Users | ❌ | ❌ search/filter/sort | 1 | `NG0200`; cannot verify admin row/role |
| Coupons | ❌ | ⚠️ filter and draft preview | 1 | `NG0200`; 10% → 15% preview works locally; no save |
| Contact messages | ❌ | ❌ status filters | 1 | Load error; inbox contents cannot be assessed |
| Exchange rates | ❌ | ❌ refresh | 2 | Load and refresh fail; API has USD/AED rates |
| Settings | ❌ | ⚠️ draft/reload exercised | 1 | Empty actual values behind example placeholders; saved baseline unavailable |
| Storefront shop | ❌ in restored session | ❌ retry | 1 | Generic catalogue error; wishlist/session `NG0200` in console |

### Representative evidence

![Dashboard fails after session restoration](ADMIN-AUDIT-SCREENSHOTS/49-dashboard-after-session-reload.png)

![Storefront shop also fails in the restored session](ADMIN-AUDIT-SCREENSHOTS/61-storefront-shop-error.png)

Complete screenshot index, exact console stacks and source inventories follow the findings. PNGs are lossless conversions of the exact browser-returned JPEGs; original JPEGs are retained. Screenshots were saved and visually inspected. Loading captures are identified as loading evidence, not successful settled screens.

## 2. Per-screen findings

### Dashboard

- **What works:** Initial render showed revenue today/all time ₨0, orders 0, pending fulfilment 0, charts with empty states, recent/pending-order sections and navigation. Initial Refresh completed. Sidebar collapse/expand changes the layout and was restored. English/Arabic switching works for navigation and main copy. Evidence: `10-dashboard.png`, `11-dashboard-language.png`, `12-sidebar-collapsed.png`.
- **What's broken:** After session restoration, exact text: **“The dashboard didn't load”** and **“The API didn't answer. Nothing is lost — try again, and check the backend is up if it keeps failing.”** Refresh leaves the same failure. Evidence: `49-dashboard-after-session-reload.png`, `50-dashboard-refresh-error.png`.
- **What's missing:** Arabic chart titles/legends/empty text remain English: “Revenue (last 7 days)”, “Daily revenue”, “Order status”, “Top products”, “No sales yet.” Initial KPI cards contain revenue/orders only; no customer-count KPI is displayed even though the source summary type includes customer fields.
- **Not tested:** Populated charts/recent orders because the initial data was empty; chart accuracy under real sales; logout submission (kept the user's session).

### Orders

- **What works:** Initial list showed “0 of 0 orders” / “No orders yet.” Status options Pending, Processing, Shipped, Delivered and Cancelled were selected, plus All statuses. Settled Processing/Shipped/Delivered/Cancelled empty states rendered. Searching `AUDIT-NO-MATCH` showed **“Nothing on this page matches ‘AUDIT-NO-MATCH’”** (UI uses curly double quotes) and explained the 25-order page scope. CSV click produced “Download started” and a 134-byte header-only CSV, retained as `orders-export.csv`. Evidence: `13-orders.png`, `15-orders-search-empty.png`, `16-orders-export.png`, `17-orders-*.png`.
- **What's broken:** No application failure confirmed during these initial Orders tests. `14-orders-pending.png` shows loading only; it is not evidence of a settled Pending result.
- **What's missing:** Search is page-local, not a search of every order. The zero-selection bulk bar remains visible (“0 items selected”).
- **Not tested:** Row sort, pagination, selecting orders and bulk bar actions require records. No real order changed/deleted, no bulk request submitted, and no order placed. Orders was not retested after the later restored-session failure; the initial success is not an end-to-end readiness pass.

### Order detail

- **What works:** The route and read endpoint are defined in source.
- **What's broken:** No detail failure reproduced because no real order was available to open.
- **What's missing:** Live evidence of line items, customer/shipping/payment/tracking/notes layout.
- **Not tested:** Entire screen; no fabricated order ID or test order used. Status and tracking writes were excluded by the user.

### Revenue

- **What works:** This additional navigation route loaded initially with All time / This month / Today all ₨0, “Nothing sold yet,” and a top-product section. Refresh completed in the initial session. Evidence: `18-revenue.png`.
- **What's broken:** No initial failure reproduced.
- **What's missing:** Populated revenue/share verification.
- **Not tested:** Revenue under nonempty sales and after the subsequent restored-session runtime failure.

### Products

- **What works:** Initial catalogue rendered **18** named products, categories, prices and thumbnails. Search/category controls, Export products and Add product were visible. Evidence: `19-products.png`.
- **What's broken:** Searching `AUDIT-NO-MATCH` stayed on **“Loading products…”** across repeated inspections without a settled result. Evidence: `20-products-search-empty.png` and `21-products-search-stuck.png` (despite the first filename, both are loading-state evidence). Later reads show **“Failed to load products”**, **“0 products in the catalogue”**, **“No products found.”** Console records `Failed to load products D: NG0200`. Export click shows **“Export failed”**; no Products CSV was verified. Evidence: `56-products-arabic-error.png`, `57-products-export-error.png`, `60-products-final-no-audit-records.png`.
- **What's missing:** At the audited narrow width, product Edit/Delete links/buttons exist in the DOM but their bounding boxes are 0×0 and they are absent from the visible/accessibility controls. Local inline CSS hides row spans from the fifth onward below 900 px, including actions. No alternative mobile action is visible. No sort or pagination controls were exposed; source requests limit=500. No hard-delete UI was found in the routed source; `adminDelete(id, hard=true)` exists only as a service option, while the UI calls default soft deletion.
- **Not tested:** Category-filter correctness after the search failure; soft/hard deletion or edit of a real product; dummy deletion, restoration and persistence. No error was patched, bypassed with direct writes or converted into a passing result.

### New product form

- **What works:** Form renders Basic info, two-language copy, toggles and a save-first media state. Every available non-category field was exercised locally: ID, price, old price, badge, size, display order, spin/active toggles, English/Arabic name, tagline, description, ingredient/benefit multiline fields and usage. Prescribed price/old price/size/badge/active/spin and bilingual copy were entered; required taglines were added because the form requires them. Evidence: `22-new-product.png`, `58-product-draft-not-saved.png`.
- **What's broken:** Required Category contains only disabled **“Select a category”**; no existing category can be chosen. Console records `Failed to load categories D: NG0200`. This blocks a valid create. Evidence: `23-product-category-missing.png`.
- **What's missing:** Inline category-load failure/retry; a usable category selection. There is no legacy numeric `images` field in this form; uploaded media is managed only after a product is saved.
- **Validation verified:** Invalid `AUDIT INVALID` ID, blank category and price -1 produce **“Required. Use lowercase letters, numbers, and dashes.”**, **“Category is required”**, and **“Price must be a positive number”** on blur. Evidence: `59-product-validation.png`. No submission was made with invalid fields, as required.
- **Not tested:** Create submission and persisted edits. Draft was canceled. The draft-only unique ID was `audit-test-delete-me-202610170023`; **it was never created**. The name/copy, display-order=99 and optional text changes were local input tests only, not departures in a saved production fixture.

### Edit product form / media

- **What works:** Source defines product edit loading, media listing, image upload/delete, video upload and confirmations. New form correctly says to save first.
- **What's broken:** Blocked by inability to create a valid dummy; no edit/media failure reproduced.
- **What's missing:** Live persisted-name/field changes; 100×100 JPEG upload, preview, storefront display, deletion and cleanup verification.
- **Not tested:** All persisted edit/media operations. **Video upload not tested in this audit**, as requested. No test image generated/uploaded because there was no saved sandbox product. No real product opened for editing.

### Categories

- **What works:** Add category opens a form; ID, English/Arabic names, Image URL and Display order accept an unsaved dummy draft; Create enables when valid; Cancel closes/discards it. Evidence: `26-category-create-dialog.png`, `54-category-unsaved-draft.png`.
- **What's broken:** Exact console: **`Failed to load categories D: NG0200`**. UI shows **“0 categories”**, **“No categories yet.”** and a toast **“Failed to load categories”**. A separate read-only GET `/api/categories` returned HTTP200 with five existing categories: mists, serums, soaps, cold-pressed-oils, hair-oils. The UI empty state therefore does not establish an empty database. Evidence: `25-categories-load-error.png`.
- **What's missing:** Persistent load-error/retry state instead of a create-first invitation; translated English admin labels in Arabic mode (`53-categories-arabic.png`).
- **Not tested:** Create/edit/delete persistence or live delete confirmation. The draft `audit-test-delete-me-draft` / `AUDIT TEST — DELETE ME` was canceled without submission; existing categories untouched.

### Inventory

- **What works:** Search accepts `AUDIT-NO-MATCH`; Low stock only can be checked. Evidence: `27-inventory-error.png`–`29-inventory-search-error.png`.
- **What's broken:** **`Failed to load inventory D: NG0200`**, toast **“Failed to load inventory”**, followed by **“0 products”** / **“No products match your filter.”** Filters repeat failure rather than loading rows.
- **What's missing:** Durable error state and retry; translated labels in Arabic mode (`55-inventory-arabic.png`).
- **Not tested:** Quantities 5 → 100, low-stock threshold or any inventory save; no dummy exists and no real inventory touched.

### Customers

- **What works:** Search field, Refresh/Try again affordances and Arabic translation of error/main content render. No customer row/account opened. Evidence: `30-customers.png`–`33-customers-arabic-error.png`.
- **What's broken:** **“The customers didn't load”** with the shared **“The API didn't answer…”** message. Try again and search retain failure. No separate customer exception is logged by this component, so do not manufacture a customer-specific `NG0200` stack.
- **What's missing:** Readable list, sort/filter/pagination verification and a reliable record count.
- **Not tested:** Edit/delete actions, customer-data quality/test-junk assessment and populated sorting because the list failed. No assumption that zero real customers exist.

### Users

- **What works:** Search accepts a query; role selector accepts Admins; sort accepts Name (A–Z). No role toggle clicked. Evidence: `34-users-arabic.png`, `35-users-filter-sort-search.png`.
- **What's broken:** **`Failed to load users D: NG0200`**, **“Failed to load users”** toast, then **“0 users · 0 admins”** / **“No users match your filter.”** This does not prove the admin account is missing.
- **What's missing:** Explicit error state, translated labels and accessible labels on the two select controls (snapshot exposes unnamed comboboxes).
- **Not tested:** Account row/`is_admin` verification, other sort/role values and pagination under actual rows. The sidebar identifies the current admin email; that is not proof of its Users-list row.

### Coupons

- **What works:** Active only toggles; New coupon opens a form. An unsaved `AUDITTEST10`, percentage=10, minimum=1000 draft previewed correctly. Changing percentage to15 and unchecking Active updated the preview; Cancel discarded the draft. Evidence: `36-coupons-arabic-error.png`–`40-coupon-draft-15-not-saved.png`.
- **What's broken:** **`Failed to load coupons D: NG0200`**, toast **“Failed to load coupons”**, followed by **“No coupons yet.”**
- **What's missing:** Durable error state and Arabic translation of list/form labels.
- **Not tested:** Create, persisted edit, delete or code uniqueness; the failed list cannot verify AUDITTEST10 is unused. No real or dummy coupon saved. Local 10% → 15% preview is not a persisted edit pass.

### Contact messages

- **What works:** All/Unread/Read/Replied selector is exposed; all three status filters were exercised without touching a message. Main/error text translates into Arabic. Evidence: `41-messages.png`, `42-messages-*.png`.
- **What's broken:** **“The messages didn't load”** / shared **“The API didn't answer…”** across filters. No message contents or real emptiness established.
- **What's missing:** Inbox/count/status verification; successful retry/data-state evidence.
- **Not tested:** Open/read/replied/delete/email actions. Source `toggle()` auto-marks an unread message read; opening a real unread message would violate the stricter no-real-data-write instruction. This side effect is also stated in the screen subtitle. No messages were opened or marked and no email link used. Do **not** interpret the failed screen as “no messages to test.”

### Exchange rates

- **What works:** Shell/PKR explanation renders; public read-only API returns configured rates. Baseline HTTP200: AED=0.0132, USD=0.0036; `updatedAt=2026-10-16T09:56:38.996Z` (14:56:38.996 Asia/Karachi on16October).
- **What's broken:** **“Failed to load exchange rates”** with **`Failed to load rates D: NG0200`**. UI incorrectly says **“No exchange rates configured yet. Click Refresh from API to populate them.”** Clicking requested provider refresh gives **“Failed to refresh rates”** and **`Refresh failed D: NG0200`**. Evidence: `43-exchange-rates.png`, `44-rates-refresh-failed.png`.
- **What's missing:** Accurate error-versus-empty distinction, visible saved timestamp/rows and translated Arabic-mode labels (`52-rates-arabic.png`).
- **Not tested:** Manual override, deliberately untouched. Provider success/staleness handling is unverified. Public before/after API snapshots show **identical rates and timestamp**, retained in `rates-before-refresh.json` / `rates-after-refresh.json`; this is not a claim about provider health.

### Settings

- **What works:** All seven fields render with labels/help: free-shipping minimum, COD charge, phone, WhatsApp, support email, base currency, topbar announcement. Save initially disabled. Unsaved announcement `AUDIT UNSAVED — DELETE ME` enables Save and shows “You have unsaved changes.” No Save click. Browser reload removes the draft and disables Save again. Evidence: `45-settings-load-error.png`, `46-settings-unsaved-draft.png`, `48-settings-draft-discarded.png`.
- **What's broken:** **`Failed to load settings D: NG0200`** / **“Failed to load settings”**. DOM input values are empty strings; examples such as3000/PKR/support email are **placeholders, not loaded production values**. Failed-load form remains editable, allowing Save to enable from an unknown baseline.
- **What's missing:** Durable load error, protection against treating placeholders as saved data, and Arabic translation (`51-settings-arabic.png`). Storefront welcome popup appears on the admin page after reload (`47-storefront-popup-on-admin.png`).
- **Not tested:** Real setting values or saving, intentionally prohibited. Reset was clicked while clean and failed to load again. Draft discard is verified, but reversion to the actual saved production value is **not** verifiable while reads fail.

### Storefront integration

- **What works:** `/shop` opens in a new real browser tab; account/admin navigation renders.
- **What's broken:** Restored signed-in session shows **“Something went wrong at our end. Try again in a moment — nothing was lost.”** Retry retains the error. Console contains **`Failed to load wishlist on session restore D: NG0200`** and **`Failed to load header categories D: NG0200`**. Evidence: `61-storefront-shop-error.png`, `62-storefront-retry-error.png`.
- **What's missing:** Catalogue/category data and a dummy integration path.
- **Not tested:** Dummy shop search/PDP/image rendering because no dummy was created. No existing customer account opened; no cart, checkout or order submission used. No fabricated dummy PDP requested as a substitute.

## 3. Cross-cutting issues

### P1 — Restored-session Angular circular dependency

The initial logged-in state had successful reads/export. After full navigation and session restoration, multiple screens failed and console logs expose `NG0200`. Angular identifies this code as a dependency-injection cycle: [official NG0200 reference](https://angular.dev/errors/NG0200).

**Likely cause inferred from local source, not a patched-build result:** `AuthService` constructor calls `loadStoredUser()`, which calls and subscribes to `WishlistService.loadWishlist()`. That starts an HTTP request while AuthService is still being constructed. `AuthInterceptor` eagerly injects AuthService, so interceptor initialization can request the service currently under construction. `app.config.ts` registers this class interceptor with `withInterceptorsFromDi()`. The storefront's session-restore warning and instance-initializer stack support this diagnosis. Exact named deployed DI token is absent from the minified error, so the source-based path is a strong diagnosis, not an independently instrumented proof.

**Most important fix:** remove the construction-time auth/wishlist/interceptor dependency cycle and retest a signed-in reload, new tab and subsequent admin requests before running controlled production CRUD tests. No fix implemented in this audit.

### P1/P2 — Failure states misrepresented as data

Categories, Products, Inventory, Users, Coupons and Rates display zero/empty states following failed reads. Public `/api/categories` and `/api/rates` returned real records, demonstrating the empty UI is unreliable. Settings goes further: empty inputs with realistic placeholders remain editable after its load failure. These states invite actions from a false baseline. Customers, Messages and Dashboard have clearer dedicated error panels, although their shared copy blames the API even when the observed error is client-side DI.

### i18n

- English and Arabic dictionaries each define **257 admin keys**, with matching key sets; full values appear in AppendixC.
- No raw `admin.*` key was observed in the inspected visible states. This is not coverage of blocked edit/detail screens.
- Confirmed English in Arabic mode: dashboard charts; Products, Categories, Inventory, Users, Coupons/form, Rates and Settings labels/actions/error toasts. New Product basic/admin labels remain English while its media note translates.
- RTL makes English placeholders/Latin units awkward (e.g. the product size displays visually as “ml100”; values were not changed). Dictionary parity does not translate hardcoded templates.

### Console

34 distinct captured warning/error events (deduplicated by exact level/timestamp/message/source), **all containing NG0200**. Ten distinct first-line prefixes. Exact timestamps/source URLs/full messages are in AppendixE and `console-all-deduplicated.json`; chronological per-screen DOM/console evidence is in `live-evidence.json`. No other NG code or distinct uncaught exception was captured. Instrumentation/tool timeouts are recorded separately, not called production HTTP failures.

### Network

**No 4xx/5xx URL/status pair was captured. This is not a zero-failure network pass.** The available browser interface exposes console logs but no Network-tab/HAR trace. The observed DI error is client-side and must not be reported as an invented backend500. Separate read-only diagnostics returned200 for `/api/categories` and `/api/rates` before/after refresh. Orders CSV downloaded successfully, but its exact HTTP status was not independently captured. Authenticated `/api/admin/products` cleanup query was not executed; no dummy was created and the browser session could not be used for a separate authenticated API read through the available interface.

### Layout, accessibility and interaction

- **Confirmed:** Narrow Products layout hides Edit/Delete controls (0×0 DOM rectangles; source breakpoint below900px hides their containing columns), rather than providing an alternative action menu. Screenshot `19-products.png`.
- **Confirmed:** Floating storefront WhatsApp control remains on admin screens and overlaps the lower-right form actions/empty-state region in narrow captures. Welcome promotion overlays admin Settings/New Product after full navigation; visible “COMING SOON” content also differs from its accessible15%-offer description. Screenshot `47-storefront-popup-on-admin.png`.
- **Confirmed:** Product search, product-category filter, user search and the two user select filters lack explicit visible associated labels in the inspected UI (search relies on placeholder; unnamed select comboboxes are exposed). New Product, coupon/category forms and Settings have field labels. `Admin sections` / `Cart` / hidden Close accessible names remain English in Arabic DOM snapshots.
- **Limits:** No full contrast/keyboard/screen-reader audit, wide desktop admin comparison or WCAG compliance claim. Hidden product actions are an actual task blocker at the captured width, not a claim they are absent at every size.
- **Dead controls:** Data controls fail because reads fail; do not label every button dead. Some route clicks/navigation commands timed out before the destination later rendered, so those are not conclusive dead-link findings. No destructive action was invoked, so live confirmation coverage is unverified; source includes delete confirmations.

## 4. Dummy product lifecycle

| Required step | Actual result |
|---|---|
| Unique ID | `audit-test-delete-me-202610170023`, draft only |
| Prescribed local fields | Entered; toggles and bilingual optional fields also exercised |
| Existing category | Cannot choose one; options fail with NG0200 |
| Create/save | **Not submitted**; user prohibits saving invalid fields |
| Appear in admin list/storefront | Not tested; never persisted |
| Persisted rename/edit | Not tested |
| Image upload/preview/delete | Not tested; no saved sandbox product |
| Video upload | Not tested as requested |
| Inventory5 →100 | Not tested; no dummy inventory row |
| Soft/hard delete | Not attempted; no record to delete |
| API absence check | Not performed; no successful creation to reverse |
| Evidence | `58-product-draft-not-saved.png`, `59-product-validation.png`; these are **not** creation/lifecycle success screenshots |

No `01-dummy-created.png` or similar success evidence is fabricated. Category/coupon drafts were likewise never persisted. These blocked lifecycle tests must be rerun after the runtime issue is fixed.

## 5. Cleanup confirmation and scope limits

- **Product:** Never created; draft canceled without submitting. No product/inventory/media data to remove.
- **Category:** Never created; draft `audit-test-delete-me-draft` canceled. No existing category altered.
- **Coupon:** Never created; `AUDITTEST10` preview draft canceled. No existing coupon altered.
- **Settings:** Only an unsaved local announcement draft; browser reload removed it. Save never clicked.
- **Provider refresh:** Only authorized mutation-capable operation attempted. It failed with NG0200; before/after public rates and timestamp are identical.
- **Real records:** No product/customer/order/user/message CRUD/status/role/tracking/reply mutation submitted. No destructive confirmation accepted; no emails or order placement triggered by audit actions.
- **Database:** No audit-created production records or uploaded assets exist from this run. **Full database equality and authenticated cleanup-list queries were not independently verified**; concurrent production activity was not monitored. Do not claim a database snapshot restoration.
- **Final Products screenshot:** `60-products-final-no-audit-records.png` honestly shows the **load failure**, not a return to a healthy list. Its zero count does not prove API absence. The initial healthy18-product screenshot is `19-products.png`.
- **Browser:** Local language restored to English; rail expanded as initially found; original admin session retained. Temporary duplicate/storefront tabs closed. No password/session token stored in artifacts.
- **Repository:** Only report/evidence artifacts created. Existing untracked files preserved. No source edits, commit, push or deploy.

### Coverage boundary

This is a **completed report of the safely executable audit, with blocked tests explicitly documented**, not a claim that every requested feature/lifecycle passed. Remaining required coverage: valid product/category/coupon create/edit/delete and authenticated cleanup verification; media and inventory lifecycle; real-order detail when available; populated pagination/sort/bulk views; full network capture and broader accessibility/responsive checks. The cause of blocked writes is concrete application failure, not missing permission or missing admin sign-in.

## Appendix A. Preparation: environment, routes and navigation

Source: `Website-Angular/src/environments/environment.production.ts`.

- `apiUrl`: `/api`, resolving on the production site to `https://www.beutepro.com/api`.
- `adminPath`: `admin-panel-bdjhdfvjdsbfmnsdfmnsd-vh09879823749823bm475nkndsf-dfshidf`.
- Dashboard: `https://www.beutepro.com/admin-panel-bdjhdfvjdsbfmnsdfmnsd-vh09879823749823bm475nkndsf-dfshidf/dashboard`.
- Supplied bare-domain access canonicalizes to `www` in the connected live session.

All paths below are relative to `/<adminPath>/`. Source: `admin/admin.routes.ts`.

| Route | Component / behavior |
|---|---|
| Parent `''` | AdminLayoutComponent, protected by adminGuard |
| dashboard | DashboardComponent |
| orders | AdminOrdersComponent |
| orders/:id | AdminOrderDetailComponent |
| revenue | RevenueComponent |
| products | AdminProductsComponent |
| products/new | ProductFormComponent |
| products/:id/edit | ProductFormComponent |
| categories | AdminCategoriesComponent |
| inventory | AdminInventoryComponent |
| customers | AdminCustomersComponent |
| users | AdminUsersComponent |
| coupons | AdminCouponsComponent |
| contact | ContactMessagesComponent |
| exchange-rates | AdminExchangeRatesComponent |
| settings | AdminSettingsComponent |
| Child `''` | Full-match redirect to dashboard |

Source rail groups and items from `admin-layout.component.html`:

- Overview: Dashboard, Orders, Revenue.
- Catalog: Products, Categories, Inventory.
- Customers: Customers, Users.
- Marketing: Coupons.
- System: Messages, Exchange rates, Settings.
- Other controls: expand/collapse sidebar, signed-in email, View storefront, Log out with confirmation. Sidebar collapse persists locally under `bp_admin_rail`.

Categories and coupon forms open within their list screens; they do not have separate routes in this route file.

## Appendix B. Preparation: API inventory

Read: `admin/admin-api.ts` and admin-used services `auth.ts`, `order.ts`, `product.service.ts`, `category.service.ts`, `coupon.service.ts`, `inventory.service.ts`, `user-admin.service.ts`, `export.service.ts`, `currency.service.ts`, `settings.service.ts`, and `upload.service.ts`. Auth also loads/clears wishlist through `wishlist.ts`; core i18n/storage/toast/layout services provide local presentation/state, not admin resource endpoints.

All paths start with `/api`. This is the **source-defined request inventory**, not a network execution log; some reads/exports and the provider-refresh control were exercised as documented above. Query options are described where material.

| Method | Path | Purpose / screen |
|---|---|---|
| POST | /auth/login | Existing credential login |
| GET | /users/me | Resolve current user / external-login session |
| GET | /wishlist | Auth's post-login wishlist loading |
| GET | /admin/dashboard | KPIs, status/daily-revenue/top-product/recent-order data |
| GET | /admin/orders | Paginated list; page, limit, optional status |
| GET | /admin/orders/:id | Read one order |
| PUT | /admin/orders/:id/status | Single status update; prohibited on real orders |
| PUT | /admin/orders/:id/tracking | Tracking/courier update; prohibited on real orders |
| PUT | /admin/orders/bulk/status | Bulk status update; prohibited on real orders |
| PUT | /admin/orders/bulk/tracking | Bulk tracking/courier update; prohibited on real orders |
| GET | /admin/revenue | Revenue totals and top-product revenue |
| GET | /admin/contact | Paginated inbox; optional unread/read/replied status |
| PUT | /admin/contact/:id/status | Mark read/unread/replied; also triggered on opening unread messages |
| DELETE | /admin/contact/:id | Permanent message deletion; excluded for real data |
| GET | /admin/customers | Search, sortBy/sortDir, page/limit |
| PUT | /admin/customers/:id | Customer details update; excluded |
| DELETE | /admin/customers/:id | Customer deletion; excluded |
| GET | /categories | Category lists used by admin lists/forms |
| POST | /admin/categories | Create category |
| PUT | /admin/categories/:id | Update category |
| DELETE | /admin/categories/:id | Delete category |
| GET | /admin/products | Includes inactive products; category/badge/search/page/limit; includeMedia=true |
| GET | /products/:id | Edit form loads product through public lookup; includeMedia=true |
| POST | /admin/products | Product creation; includeMedia=true |
| PUT | /admin/products/:id | Product update; includeMedia=true |
| DELETE | /admin/products/:id | Default soft deletion/deactivation |
| DELETE | /admin/products/:id?hard=true | Service-defined permanent purge; routed Products UI does not call this option |
| GET | /admin/products/:id/media | Full media records with IDs |
| POST | /admin/products/:id/media/images | Multipart images; field files |
| POST | /admin/products/:id/media/video | Multipart video; field file; excluded by request |
| DELETE | /admin/products/:id/media/:mediaId | Remove uploaded media |
| GET | /admin/inventory | Inventory list; optional search, lowStockOnly=true |
| PUT | /admin/inventory/:productId | Absolute quantity and optional low-stock threshold |
| GET | /admin/users | Search/role/sort/page/limit |
| PUT | /admin/users/:id/role | Set admin flag; excluded |
| GET | /admin/coupons | activeOnly, page, limit; screen requests limit=200 |
| POST | /admin/coupons | Create coupon |
| PUT | /admin/coupons/:code | Update coupon |
| DELETE | /admin/coupons/:code | Delete coupon |
| GET | /rates | Public rate data consumed by admin Exchange rates |
| POST | /admin/rates/refresh | Refresh from provider; may persist global rates |
| PUT | /admin/rates/:currency | Manual override; excluded |
| GET | /admin/settings | Read all settings |
| PUT | /admin/settings | Bulk upsert changed settings; excluded |
| GET | /admin/export/orders.csv | Orders CSV; optional status/startDate/endDate; screen passes current status |
| GET | /admin/export/products.csv | Products CSV |
| GET | /admin/export/customers.csv | Defined by ExportService; no routed Customers consumer found; not exercised |

Additional methods present in the same services, without a direct consumer in the routed admin screens inspected: `GET /categories/:id`, `GET /admin/users/:id`, `GET /admin/inventory/low-stock`. Related public integration methods: `GET /products`, `GET /inventory/:productId`, `GET /settings`. Other auth/customer/checkout methods in shared services are outside admin scope and must not be exercised: registration, profile/password updates, wishlist writes, order placement and coupon validation. Google login navigation is `/api/auth/google` in production configuration.

## Appendix C. Preparation: complete admin translation inventory

The table below is generated directly from this checkout's `core/data/i18n.data.ts`, including both language values. It inventories defined keys, not text verified in production. Screens that hardcode labels bypass this dictionary.


English: 257 admin keys; Arabic: 257 admin keys; union: 257 keys.

| Key | English | Arabic |
|---|---|---|
| `admin.common.refresh` | Refresh | تحديث |
| `admin.common.tryAgain` | Try again | إعادة المحاولة |
| `admin.common.cancel` | Cancel | إلغاء |
| `admin.media.title` | Product media | وسائط المنتج |
| `admin.media.subtitle` | Manage uploaded product photos and the 360° video. Static images remain the fallback when no uploads exist. | إدارة صور المنتج المرفوعة وفيديو العرض بزاوية 360°. تُستخدم الصور الأصلية عند عدم وجود صور مرفوعة. |
| `admin.media.refresh` | Refresh media | تحديث الوسائط |
| `admin.media.loading` | Loading media… | جارٍ تحميل الوسائط… |
| `admin.media.retry` | Try again | المحاولة مجددًا |
| `admin.media.images` | Images | الصور |
| `admin.media.imagesHint` | Images appear in the storefront in the order shown. | تظهر الصور في المتجر بالترتيب المعروض. |
| `admin.media.noImages` | No uploaded images yet. The storefront uses the existing static photos. | لا توجد صور مرفوعة بعد. يستخدم المتجر الصور الأصلية. |
| `admin.media.imageAlt` | Product image {count} | صورة المنتج {count} |
| `admin.media.previewError` | Preview unavailable. The media item can still be deleted. | المعاينة غير متاحة. لا يزال بإمكانك حذف هذا العنصر. |
| `admin.media.deleteImage` | Delete image {count} | حذف الصورة {count} |
| `admin.media.delete` | Delete | حذف |
| `admin.media.dropImages` | Drop images here or choose files | أفلت الصور هنا أو اختر الملفات |
| `admin.media.imageFormats` | JPEG, PNG or WebP · Up to 10 images per upload · 10 MB per file | JPEG أو PNG أو WebP · حتى 10 صور في كل عملية رفع · 10 ميجابايت لكل ملف |
| `admin.media.chooseImages` | Choose images | اختيار الصور |
| `admin.media.selectedFiles` | Files ready to upload | ملفات جاهزة للرفع |
| `admin.media.removeFile` | Remove {name} from the upload queue | إزالة {name} من قائمة الرفع |
| `admin.media.remove` | Remove | إزالة |
| `admin.media.uploadingImages` | Uploading images… | جارٍ رفع الصور… |
| `admin.media.uploadImages` | Upload images ({count}) | رفع الصور ({count}) |
| `admin.media.wait` | Keep this page open until the upload finishes. | اترك هذه الصفحة مفتوحة حتى يكتمل الرفع. |
| `admin.media.video` | 360° video | فيديو بزاوية 360° |
| `admin.media.videoHint` | One uploaded video per product. Uploading another replaces it. | فيديو مرفوع واحد لكل منتج. رفع فيديو آخر يستبدل الفيديو الحالي. |
| `admin.media.noVideo` | No uploaded video. Products with an existing static video continue to use it. | لا يوجد فيديو مرفوع. تواصل المنتجات التي لها فيديو أصلي استخدامه. |
| `admin.media.deleteVideo` | Delete video | حذف الفيديو |
| `admin.media.dropVideo` | Drop an MP4 here or choose a file | أفلت فيديو MP4 هنا أو اختر ملفًا |
| `admin.media.videoFormats` | One MP4 video · 10 MB maximum | فيديو MP4 واحد · بحد أقصى 10 ميجابايت |
| `admin.media.chooseVideo` | Choose video | اختيار الفيديو |
| `admin.media.uploadingVideo` | Uploading video… | جارٍ رفع الفيديو… |
| `admin.media.replaceVideo` | Replace video | استبدال الفيديو |
| `admin.media.uploadVideo` | Upload video | رفع الفيديو |
| `admin.media.replaceTitle` | Replace the uploaded video? | استبدال الفيديو المرفوع؟ |
| `admin.media.replaceBody` | The current uploaded video will be overwritten. This cannot be undone. | سيتم استبدال الفيديو المرفوع الحالي. لا يمكن التراجع عن ذلك. |
| `admin.media.deleteTitle` | Delete this media item? | حذف هذا العنصر؟ |
| `admin.media.deleteBody` | The uploaded file will be removed from storage and this product. This cannot be undone. Static media is used when no uploads remain. | سيُحذف الملف المرفوع من التخزين ومن هذا المنتج. لا يمكن التراجع عن ذلك. تُستخدم الوسائط الأصلية عند عدم بقاء أي ملفات مرفوعة. |
| `admin.media.saveFirst` | Save the product first to add images and video. | احفظ المنتج أولاً لإضافة الصور والفيديو. |
| `admin.media.imageCountError` | Choose up to 10 images per upload. Remove queued files before adding more. | اختر حتى 10 صور في كل عملية رفع. أزل الملفات المنتظرة قبل إضافة المزيد. |
| `admin.media.videoCountError` | Choose one MP4 video at a time. | اختر فيديو MP4 واحدًا في كل مرة. |
| `admin.media.emptyFile` | {name}: this file is empty. | {name}: هذا الملف فارغ. |
| `admin.media.largeFile` | {name}: this file exceeds the 10 MB limit. | {name}: يتجاوز هذا الملف حد 10 ميجابايت. |
| `admin.media.imageTypeError` | {name}: choose a JPEG, PNG or WebP image. | {name}: اختر صورة JPEG أو PNG أو WebP. |
| `admin.media.videoTypeError` | {name}: choose an MP4 video. | {name}: اختر فيديو MP4. |
| `admin.media.selected` | Files ready to upload: {count}. | ملفات جاهزة للرفع: {count}. |
| `admin.media.imagesUploaded` | Images uploaded. | تم رفع الصور. |
| `admin.media.videoUploaded` | Video uploaded. | تم رفع الفيديو. |
| `admin.media.deleted` | Media item deleted. | تم حذف العنصر. |
| `admin.media.deleting` | Deleting… | جارٍ الحذف… |
| `admin.media.loadError` | Media could not be loaded. Try refreshing it. | تعذّر تحميل الوسائط. حاول تحديثها. |
| `admin.media.changeError` | The change could not be confirmed. Your selected files have been kept. | تعذّر تأكيد التغيير. تم الاحتفاظ بالملفات المحددة. |
| `admin.media.checkBeforeRetry` | Refreshing the media list. Check what was saved before trying again. | جارٍ تحديث قائمة الوسائط. تحقق مما تم حفظه قبل المحاولة مجددًا. |
| `admin.media.networkError` | The connection was interrupted. Check your connection. | انقطع الاتصال. تحقق من اتصالك بالإنترنت. |
| `admin.media.authError` | Admin access is required. Sign in again before changing media. | يلزم وصول المسؤول. سجّل الدخول مجددًا قبل تغيير الوسائط. |
| `admin.media.notFound` | The product or media item no longer exists. Refresh the media list. | لم يعد المنتج أو العنصر موجودًا. حدّث قائمة الوسائط. |
| `admin.media.sizeError` | The upload was rejected. Each file must be 10 MB or smaller. | تم رفض الرفع. يجب ألا يتجاوز كل ملف 10 ميجابايت. |
| `admin.media.formatError` | The file format was rejected. Choose a valid JPEG, PNG, WebP image or MP4 video. | تم رفض صيغة الملف. اختر صورة JPEG أو PNG أو WebP صالحة، أو فيديو MP4. |
| `admin.common.save` | Save | حفظ |
| `admin.common.saving` | Saving… | جارٍ الحفظ… |
| `admin.common.apiDown` | The API didn't answer. Nothing is lost — try again, and check the backend is up if it keeps failing. | لم يستجب الخادم. لا شيء ضاع — يُرجى المحاولة مرة أخرى، والتحقق من أن الخادم يعمل إذا استمر العطل. |
| `admin.common.previous` | Previous | السابق |
| `admin.common.next` | Next | التالي |
| `admin.common.pageOf` | Page {page} of {total} | صفحة {page} من {total} |
| `admin.common.notProvided` | Not provided | غير متوفر |
| `admin.common.clearSearch` | Clear search | مسح البحث |
| `admin.common.edit` | Edit | تعديل |
| `admin.common.delete` | Delete | حذف |
| `admin.common.actions` | Actions | إجراءات |
| `admin.common.language` | Language | اللغة |
| `admin.common.filterByStatus` | Filter by status | تصفية حسب الحالة |
| `admin.nav.groupOverview` | Overview | نظرة عامة |
| `admin.nav.groupCatalog` | Catalog | الكتالوج |
| `admin.nav.groupCustomers` | Customers | العملاء |
| `admin.nav.groupMarketing` | Marketing | التسويق |
| `admin.nav.groupSystem` | System | النظام |
| `admin.nav.dashboard` | Dashboard | لوحة التحكم |
| `admin.nav.orders` | Orders | الطلبات |
| `admin.nav.customers` | Customers | العملاء |
| `admin.nav.revenue` | Revenue | الإيرادات |
| `admin.nav.messages` | Messages | الرسائل |
| `admin.nav.products` | Products | المنتجات |
| `admin.nav.categories` | Categories | الفئات |
| `admin.nav.inventory` | Inventory | المخزون |
| `admin.nav.users` | Users | المستخدمون |
| `admin.nav.coupons` | Coupons | أكواد الخصم |
| `admin.nav.rates` | Exchange rates | أسعار الصرف |
| `admin.nav.settings` | Settings | الإعدادات |
| `admin.nav.adminLabel` | Admin | الإدارة |
| `admin.nav.expand` | Expand sidebar | توسيع الشريط الجانبي |
| `admin.nav.collapse` | Collapse sidebar | طي الشريط الجانبي |
| `admin.nav.toggleAria` | Toggle sidebar | تبديل الشريط الجانبي |
| `admin.layout.signedInAs` | Signed in as | تم تسجيل الدخول باسم |
| `admin.layout.viewStorefront` | View storefront | عرض المتجر |
| `admin.layout.logout` | Log out | تسجيل الخروج |
| `admin.layout.logoutConfirmHeading` | Log out of the admin panel? | تسجيل الخروج من لوحة التحكم؟ |
| `admin.layout.logoutConfirmBody` | You'll need to sign in again to get back in. | سيلزم تسجيل الدخول مجددًا للعودة إليها. |
| `admin.dashboard.title` | Dashboard | لوحة التحكم |
| `admin.dashboard.sub` | Everything that moved since you were last here. | كل ما تغيّر منذ آخر زيارة. |
| `admin.dashboard.revenueToday` | Revenue today | إيرادات اليوم |
| `admin.dashboard.allTime` | {amount} all time | {amount} إجمالاً منذ البداية |
| `admin.dashboard.orders` | Orders | الطلبات |
| `admin.dashboard.pendingFulfilment` | {n} pending fulfilment | {n} بانتظار التجهيز |
| `admin.dashboard.pendingSection` | Pending fulfilment | بانتظار التجهيز |
| `admin.dashboard.allOrders` | All orders | كل الطلبات |
| `admin.dashboard.noStatusesTitle` | No orders yet | لا توجد طلبات بعد |
| `admin.dashboard.noStatusesBody` | Statuses appear here as soon as the first order lands. | ستظهر الحالات هنا فور وصول أول طلب. |
| `admin.dashboard.recentOrders` | Recent orders | أحدث الطلبات |
| `admin.dashboard.noRecentBody` | When the first order arrives it will show here, newest first. | عند وصول أول طلب سيظهر هنا، الأحدث أولاً. |
| `admin.dashboard.topProducts` | Top products | أفضل المنتجات |
| `admin.dashboard.colOrder` | Order | الطلب |
| `admin.dashboard.colPlaced` | Placed | تاريخ الطلب |
| `admin.dashboard.colCustomer` | Customer | العميل |
| `admin.dashboard.colStatus` | Status | الحالة |
| `admin.dashboard.colTotal` | Total | الإجمالي |
| `admin.dashboard.errTitle` | The dashboard didn't load | تعذّر تحميل لوحة التحكم |
| `admin.orders.title` | Orders | الطلبات |
| `admin.orders.sub` | Every order, newest first. Open one to change its status or add tracking. | كل الطلبات، الأحدث أولاً. افتح أي طلب لتغيير حالته أو إضافة رقم تتبع. |
| `admin.orders.vhSearch` | Search this page | بحث في هذه الصفحة |
| `admin.orders.searchPlaceholder` | Search number, name, email, phone | ابحث برقم الطلب أو الاسم أو البريد أو الهاتف |
| `admin.orders.allStatuses` | All statuses | كل الحالات |
| `admin.orders.countSearch` | {shown} of {page} on this page · {total} in total | {shown} من {page} في هذه الصفحة · {total} إجمالاً |
| `admin.orders.count` | {shown} of {total} orders | {shown} من {total} طلبًا |
| `admin.orders.errTitle` | The orders didn't load | تعذّر تحميل الطلبات |
| `admin.orders.noMatchTitle` | Nothing on this page matches “{q}” | لا يوجد ما يطابق «{q}» في هذه الصفحة |
| `admin.orders.noMatchBody` | The search looks at the 25 orders loaded here. Clear it, or turn the page. | يبحث هذا الحقل في الطلبات الـ25 المحمّلة هنا فقط. امسح البحث أو انتقل لصفحة أخرى. |
| `admin.orders.noStatusTitle` | No {status} orders | لا توجد طلبات بحالة {status} |
| `admin.orders.noStatusBody` | Nothing is sitting at this status right now. | لا يوجد شيء بهذه الحالة حاليًا. |
| `admin.orders.showAllStatuses` | Show all statuses | عرض كل الحالات |
| `admin.orders.emptyTitle` | No orders yet | لا توجد طلبات بعد |
| `admin.orders.emptyBody` | Orders placed on the storefront land here straight away. | تصل إلى هنا الطلبات المُقدَّمة عبر المتجر مباشرةً. |
| `admin.orders.colOrder` | Order | الطلب |
| `admin.orders.colPlaced` | Placed | تاريخ الطلب |
| `admin.orders.colCustomer` | Customer | العميل |
| `admin.orders.colItems` | Items | العناصر |
| `admin.orders.colTotal` | Total | الإجمالي |
| `admin.orders.colStatus` | Status | الحالة |
| `admin.orders.vhOpen` | Open | فتح |
| `admin.orders.open` | Open | فتح |
| `admin.orderDetail.back` | All orders | كل الطلبات |
| `admin.orderDetail.summary` | Placed {date} · {items} items · {total} | بتاريخ {date} · {items} عنصرًا · {total} |
| `admin.orderDetail.errTitle` | That order didn't load | تعذّر تحميل هذا الطلب |
| `admin.orderDetail.errBody` | It may have been removed, or the API didn't answer. Try again, or go back to the list. | ربما أُزيل الطلب، أو لم يستجب الخادم. أعد المحاولة، أو عد إلى القائمة. |
| `admin.orderDetail.statusSection` | Status | الحالة |
| `admin.orderDetail.moveTo` | Move this order to | نقل هذا الطلب إلى |
| `admin.orderDetail.trackingSection` | Tracking | التتبع |
| `admin.orderDetail.courier` | Courier | شركة الشحن |
| `admin.orderDetail.courierPlaceholder` | TCS, Leopards… | TCS، Leopards… |
| `admin.orderDetail.trackingNumber` | Tracking number | رقم التتبع |
| `admin.orderDetail.trackingPlaceholder` | e.g. 1234567890 | مثال: 1234567890 |
| `admin.orderDetail.saveTracking` | Save tracking | حفظ بيانات التتبع |
| `admin.orderDetail.itemsSection` | Items | العناصر |
| `admin.orderDetail.colProduct` | Product | المنتج |
| `admin.orderDetail.colQty` | Qty | الكمية |
| `admin.orderDetail.colUnit` | Unit | سعر الوحدة |
| `admin.orderDetail.colLine` | Line | الإجمالي الفرعي |
| `admin.orderDetail.orderTotal` | Order total | إجمالي الطلب |
| `admin.orderDetail.customerSection` | Customer | العميل |
| `admin.orderDetail.name` | Name | الاسم |
| `admin.orderDetail.email` | Email | البريد الإلكتروني |
| `admin.orderDetail.address` | Address | العنوان |
| `admin.orderDetail.phone` | Phone | الهاتف |
| `admin.orderDetail.account` | Account | الحساب |
| `admin.orderDetail.registered` | Registered customer | عميل مسجّل |
| `admin.orderDetail.guest` | Guest checkout | طلب بدون حساب |
| `admin.orderDetail.paymentSection` | Payment | الدفع |
| `admin.orderDetail.method` | Method | طريقة الدفع |
| `admin.orderDetail.status` | Status | الحالة |
| `admin.orderDetail.updated` | Updated | آخر تحديث |
| `admin.orderDetail.notes` | Notes | ملاحظات |
| `admin.orderDetail.cancelHeading` | Cancel this order? | إلغاء هذا الطلب؟ |
| `admin.orderDetail.cancelBody` | Order {number} will show as cancelled to the customer. This does not refund anything on its own. | سيظهر الطلب {number} للعميل بحالة ملغى. هذا لا يُرجع أي مبلغ من تلقاء نفسه. |
| `admin.orderDetail.cancelConfirm` | Cancel the order | إلغاء الطلب |
| `admin.orderDetail.cancelKeep` | Keep it as it is | الإبقاء على حالته |
| `admin.orderDetail.statusSetNote` | Status set to {status}. | تم ضبط الحالة على {status}. |
| `admin.orderDetail.statusErr` | That status change didn't save. The order is unchanged — try again. | تعذّر حفظ تغيير الحالة. الطلب كما كان — أعد المحاولة. |
| `admin.orderDetail.trackingSavedNote` | Tracking saved. The customer can see it on the track page. | تم حفظ بيانات التتبع. يمكن للعميل رؤيتها في صفحة التتبع. |
| `admin.orderDetail.trackingErr` | The tracking details didn't save. Try again. | تعذّر حفظ بيانات التتبع. أعد المحاولة. |
| `admin.payment.method.cod` | Cash on delivery | الدفع عند الاستلام |
| `admin.payment.method.card` | Card | بطاقة |
| `admin.payment.method.bank_transfer` | Bank transfer | تحويل بنكي |
| `admin.payment.status.unpaid` | Unpaid | غير مدفوع |
| `admin.payment.status.paid` | Paid | مدفوع |
| `admin.payment.status.pending` | Pending | قيد الانتظار |
| `admin.payment.status.refunded` | Refunded | مُسترد |
| `admin.revenue.title` | Revenue | الإيرادات |
| `admin.revenue.sub` | Takings to date, and what they came from. Cancelled orders are excluded. | الإيرادات حتى الآن، ومصدرها. الطلبات الملغاة غير محتسبة. |
| `admin.revenue.allTime` | All time | الإجمالي منذ البداية |
| `admin.revenue.thisMonth` | This month | هذا الشهر |
| `admin.revenue.today` | Today | اليوم |
| `admin.revenue.topProducts` | Top products | أفضل المنتجات |
| `admin.revenue.byRevenue` | By revenue | حسب الإيرادات |
| `admin.revenue.colProduct` | Product | المنتج |
| `admin.revenue.colRevenue` | Revenue | الإيرادات |
| `admin.revenue.colShare` | Share | الحصة |
| `admin.revenue.errTitle` | The revenue figures didn't load | تعذّر تحميل أرقام الإيرادات |
| `admin.revenue.emptyTitle` | Nothing sold yet | لا توجد مبيعات بعد |
| `admin.revenue.emptyBody` | Once orders come through, the products behind the takings are ranked here. | بمجرد ورود الطلبات، ستُرتَّب هنا المنتجات وراء الإيرادات. |
| `admin.messages.title` | Messages | الرسائل |
| `admin.messages.sub` | Everything sent through the contact form. Opening one marks it read. | كل ما وصل عبر نموذج التواصل. فتح الرسالة يجعلها مقروءة. |
| `admin.messages.allMessages` | All messages | كل الرسائل |
| `admin.messages.count` | {shown} of {total} | {shown} من {total} |
| `admin.messages.unreadSuffix` |  · {n} unread on this page |  · {n} غير مقروءة في هذه الصفحة |
| `admin.messages.errTitle` | The messages didn't load | تعذّر تحميل الرسائل |
| `admin.messages.noStatusTitle` | No {status} messages | لا توجد رسائل بحالة {status} |
| `admin.messages.noStatusBody` | Nothing is sitting at this status right now. | لا يوجد شيء بهذه الحالة حاليًا. |
| `admin.messages.showAll` | Show all messages | عرض كل الرسائل |
| `admin.messages.emptyTitle` | No messages yet | لا توجد رسائل بعد |
| `admin.messages.emptyBody` | Anything sent through the contact form on the storefront arrives here. | كل ما يُرسل عبر نموذج التواصل في المتجر يصل إلى هنا. |
| `admin.messages.replyByEmail` | Reply by email | الرد عبر البريد الإلكتروني |
| `admin.messages.markReplied` | Mark replied | تمييز كمردود عليها |
| `admin.messages.markUnread` | Mark unread | تمييز كغير مقروءة |
| `admin.messages.deleteHeading` | Delete this message? | حذف هذه الرسالة؟ |
| `admin.messages.deleteBody` | The message from {name} ({email}) will be removed permanently. There is no undo. | ستُحذف رسالة {name} ({email}) نهائيًا. لا يمكن التراجع عن ذلك. |
| `admin.messages.deleteConfirm` | Delete message | حذف الرسالة |
| `admin.messages.markedNote` | Marked {status} | تم التمييز كـ{status} |
| `admin.messages.statusErr` | That didn't save — try again | تعذّر الحفظ — أعد المحاولة |
| `admin.messages.deletedNote` | Message deleted | تم حذف الرسالة |
| `admin.messages.deleteErr` | The message wasn't deleted — try again | تعذّر حذف الرسالة — أعد المحاولة |
| `admin.messages.status.unread` | Unread | غير مقروءة |
| `admin.messages.status.read` | Read | مقروءة |
| `admin.messages.status.replied` | Replied | تم الرد |
| `admin.customers.title` | Customers | العملاء |
| `admin.customers.sub` | Registered accounts, newest first. Edit their details or remove an account. | الحسابات المسجّلة، الأحدث أولاً. عدّل بياناتهم أو احذف حسابًا. |
| `admin.customers.searchPlaceholder` | Search name, email, phone | ابحث بالاسم أو البريد أو الهاتف |
| `admin.customers.vhSearch` | Search customers | بحث في العملاء |
| `admin.customers.count` | {shown} of {total} customers | {shown} من {total} عميلًا |
| `admin.customers.errTitle` | The customers didn't load | تعذّر تحميل العملاء |
| `admin.customers.noMatchTitle` | No customers match “{q}” | لا يوجد عملاء يطابقون «{q}» |
| `admin.customers.noMatchBody` | Try a different name, email or phone number. | جرّب اسمًا أو بريدًا أو رقم هاتف مختلفًا. |
| `admin.customers.emptyTitle` | No customers yet | لا يوجد عملاء بعد |
| `admin.customers.emptyBody` | Accounts created on the storefront will appear here. | ستظهر هنا الحسابات التي تُنشأ عبر المتجر. |
| `admin.customers.colName` | Name | الاسم |
| `admin.customers.colEmail` | Email | البريد الإلكتروني |
| `admin.customers.colPhone` | Phone | الهاتف |
| `admin.customers.colAddress` | Address | العنوان |
| `admin.customers.colJoined` | Joined | تاريخ الانضمام |
| `admin.customers.colOrders` | Orders | الطلبات |
| `admin.customers.editTitle` | Edit customer | تعديل بيانات العميل |
| `admin.customers.fieldName` | Full name | الاسم الكامل |
| `admin.customers.fieldEmail` | Email | البريد الإلكتروني |
| `admin.customers.fieldPhone` | Phone | الهاتف |
| `admin.customers.fieldAddress` | Address | العنوان |
| `admin.customers.phoneHint` | A Pakistani mobile number: 03XXXXXXXXX or +923XXXXXXXXX. | رقم هاتف باكستاني: 03XXXXXXXXX أو ‎+923XXXXXXXXX. |
| `admin.customers.errName` | Enter their name. | أدخل اسم العميل. |
| `admin.customers.errEmail` | Enter a valid email address. | أدخل بريدًا إلكترونيًا صحيحًا. |
| `admin.customers.errPhone` | Enter a Pakistani mobile number as 03XXXXXXXXX or +923XXXXXXXXX. | أدخل رقم هاتف باكستاني بصيغة 03XXXXXXXXX أو ‎+923XXXXXXXXX. |
| `admin.customers.errAddress` | Address is too short — include street, area and city. | العنوان قصير جدًا — أضف الشارع والمنطقة والمدينة. |
| `admin.customers.errEmailTaken` | That email is already in use by another account. | هذا البريد الإلكتروني مستخدم بالفعل في حساب آخر. |
| `admin.customers.saveErr` | That didn't save — try again. | تعذّر الحفظ — أعد المحاولة. |
| `admin.customers.saved` | Customer updated | تم تحديث بيانات العميل |
| `admin.customers.deleteHeading` | Delete {name}? | حذف {name}؟ |
| `admin.customers.deleteBodyNoOrders` | This permanently removes their account. There is no undo. | سيُحذف هذا الحساب نهائيًا. لا يمكن التراجع عن ذلك. |
| `admin.customers.deleteBodyWithOrders` | This permanently removes their account. Their {count} order(s) stay on record but will no longer be linked to an account. There is no undo. | سيُحذف هذا الحساب نهائيًا. ستبقى طلباته الـ{count} في السجل، لكنها لن تُربط بحساب بعد الآن. لا يمكن التراجع عن ذلك. |
| `admin.customers.deleteConfirm` | Delete customer | حذف العميل |
| `admin.customers.deletedNote` | Customer deleted | تم حذف العميل |
| `admin.customers.deleteErr` | The customer wasn't deleted — try again | تعذّر حذف العميل — أعد المحاولة |

## Appendix D. Screenshot and interaction index

Each link points to the exact saved PNG for that observed state. Original JPEGs are beside them. Names containing “draft” are unsaved local forms; “final-no-audit-records” is not an authenticated database absence assertion. Loading captures14/20/21 are evidence of loading behavior, not passed settled screens.

| Screenshot | Observed route |
|---|---|
| [10-dashboard.png](ADMIN-AUDIT-SCREENSHOTS/10-dashboard.png) | `/dashboard` |
| [11-dashboard-language.png](ADMIN-AUDIT-SCREENSHOTS/11-dashboard-language.png) | `/dashboard` |
| [12-sidebar-collapsed.png](ADMIN-AUDIT-SCREENSHOTS/12-sidebar-collapsed.png) | `/dashboard` |
| [13-orders.png](ADMIN-AUDIT-SCREENSHOTS/13-orders.png) | `/orders` |
| [14-orders-pending.png](ADMIN-AUDIT-SCREENSHOTS/14-orders-pending.png) | `/orders` |
| [15-orders-search-empty.png](ADMIN-AUDIT-SCREENSHOTS/15-orders-search-empty.png) | `/orders` |
| [16-orders-export.png](ADMIN-AUDIT-SCREENSHOTS/16-orders-export.png) | `/orders` |
| [17-orders-processing.png](ADMIN-AUDIT-SCREENSHOTS/17-orders-processing.png) | `/orders` |
| [17-orders-shipped.png](ADMIN-AUDIT-SCREENSHOTS/17-orders-shipped.png) | `/orders` |
| [17-orders-delivered.png](ADMIN-AUDIT-SCREENSHOTS/17-orders-delivered.png) | `/orders` |
| [17-orders-cancelled.png](ADMIN-AUDIT-SCREENSHOTS/17-orders-cancelled.png) | `/orders` |
| [18-revenue.png](ADMIN-AUDIT-SCREENSHOTS/18-revenue.png) | `/revenue` |
| [19-products.png](ADMIN-AUDIT-SCREENSHOTS/19-products.png) | `/products` |
| [20-products-search-empty.png](ADMIN-AUDIT-SCREENSHOTS/20-products-search-empty.png) | `/products` |
| [21-products-search-stuck.png](ADMIN-AUDIT-SCREENSHOTS/21-products-search-stuck.png) | `/products` |
| [22-new-product.png](ADMIN-AUDIT-SCREENSHOTS/22-new-product.png) | `/products/new` |
| [23-product-category-missing.png](ADMIN-AUDIT-SCREENSHOTS/23-product-category-missing.png) | `/products/new` |
| [25-categories-load-error.png](ADMIN-AUDIT-SCREENSHOTS/25-categories-load-error.png) | `/categories` |
| [26-category-create-dialog.png](ADMIN-AUDIT-SCREENSHOTS/26-category-create-dialog.png) | `/categories` |
| [27-inventory-error.png](ADMIN-AUDIT-SCREENSHOTS/27-inventory-error.png) | `/inventory` |
| [28-inventory-low-stock-error.png](ADMIN-AUDIT-SCREENSHOTS/28-inventory-low-stock-error.png) | `/inventory` |
| [29-inventory-search-error.png](ADMIN-AUDIT-SCREENSHOTS/29-inventory-search-error.png) | `/inventory` |
| [30-customers.png](ADMIN-AUDIT-SCREENSHOTS/30-customers.png) | `/customers` |
| [31-customers-retry-error.png](ADMIN-AUDIT-SCREENSHOTS/31-customers-retry-error.png) | `/customers` |
| [32-customers-search-error.png](ADMIN-AUDIT-SCREENSHOTS/32-customers-search-error.png) | `/customers` |
| [33-customers-arabic-error.png](ADMIN-AUDIT-SCREENSHOTS/33-customers-arabic-error.png) | `/customers` |
| [34-users-arabic.png](ADMIN-AUDIT-SCREENSHOTS/34-users-arabic.png) | `/users` |
| [35-users-filter-sort-search.png](ADMIN-AUDIT-SCREENSHOTS/35-users-filter-sort-search.png) | `/users` |
| [36-coupons-arabic-error.png](ADMIN-AUDIT-SCREENSHOTS/36-coupons-arabic-error.png) | `/coupons` |
| [37-coupons-active-filter.png](ADMIN-AUDIT-SCREENSHOTS/37-coupons-active-filter.png) | `/coupons` |
| [38-new-coupon-form.png](ADMIN-AUDIT-SCREENSHOTS/38-new-coupon-form.png) | `/coupons` |
| [39-coupon-draft-10-percent.png](ADMIN-AUDIT-SCREENSHOTS/39-coupon-draft-10-percent.png) | `/coupons` |
| [40-coupon-draft-15-not-saved.png](ADMIN-AUDIT-SCREENSHOTS/40-coupon-draft-15-not-saved.png) | `/coupons` |
| [41-messages.png](ADMIN-AUDIT-SCREENSHOTS/41-messages.png) | `/contact` |
| [42-messages-unread.png](ADMIN-AUDIT-SCREENSHOTS/42-messages-unread.png) | `/contact` |
| [42-messages-read.png](ADMIN-AUDIT-SCREENSHOTS/42-messages-read.png) | `/contact` |
| [42-messages-replied.png](ADMIN-AUDIT-SCREENSHOTS/42-messages-replied.png) | `/contact` |
| [43-exchange-rates.png](ADMIN-AUDIT-SCREENSHOTS/43-exchange-rates.png) | `/exchange-rates` |
| [44-rates-refresh-failed.png](ADMIN-AUDIT-SCREENSHOTS/44-rates-refresh-failed.png) | `/exchange-rates` |
| [45-settings-load-error.png](ADMIN-AUDIT-SCREENSHOTS/45-settings-load-error.png) | `/settings` |
| [46-settings-unsaved-draft.png](ADMIN-AUDIT-SCREENSHOTS/46-settings-unsaved-draft.png) | `/settings` |
| [47-storefront-popup-on-admin.png](ADMIN-AUDIT-SCREENSHOTS/47-storefront-popup-on-admin.png) | `/settings` |
| [48-settings-draft-discarded.png](ADMIN-AUDIT-SCREENSHOTS/48-settings-draft-discarded.png) | `/settings` |
| [49-dashboard-after-session-reload.png](ADMIN-AUDIT-SCREENSHOTS/49-dashboard-after-session-reload.png) | `/dashboard` |
| [50-dashboard-refresh-error.png](ADMIN-AUDIT-SCREENSHOTS/50-dashboard-refresh-error.png) | `/dashboard` |
| [51-settings-arabic.png](ADMIN-AUDIT-SCREENSHOTS/51-settings-arabic.png) | `/settings` |
| [52-rates-arabic.png](ADMIN-AUDIT-SCREENSHOTS/52-rates-arabic.png) | `/exchange-rates` |
| [53-categories-arabic.png](ADMIN-AUDIT-SCREENSHOTS/53-categories-arabic.png) | `/categories` |
| [54-category-unsaved-draft.png](ADMIN-AUDIT-SCREENSHOTS/54-category-unsaved-draft.png) | `/categories` |
| [55-inventory-arabic.png](ADMIN-AUDIT-SCREENSHOTS/55-inventory-arabic.png) | `/inventory` |
| [56-products-arabic-error.png](ADMIN-AUDIT-SCREENSHOTS/56-products-arabic-error.png) | `/products` |
| [57-products-export-error.png](ADMIN-AUDIT-SCREENSHOTS/57-products-export-error.png) | `/products` |
| [58-product-draft-not-saved.png](ADMIN-AUDIT-SCREENSHOTS/58-product-draft-not-saved.png) | `/products/new` |
| [59-product-validation.png](ADMIN-AUDIT-SCREENSHOTS/59-product-validation.png) | `/products/new` |
| [60-products-final-no-audit-records.png](ADMIN-AUDIT-SCREENSHOTS/60-products-final-no-audit-records.png) | `/products` |
| [61-storefront-shop-error.png](ADMIN-AUDIT-SCREENSHOTS/61-storefront-shop-error.png) | `https://www.beutepro.com/shop` |
| [62-storefront-retry-error.png](ADMIN-AUDIT-SCREENSHOTS/62-storefront-retry-error.png) | `https://www.beutepro.com/shop` |

Early access evidence (before the user signed in): [dashboard redirect](ADMIN-AUDIT-SCREENSHOTS/01-dashboard-redirect-home.png), [login form](ADMIN-AUDIT-SCREENSHOTS/02-login-form.png), [full login](ADMIN-AUDIT-SCREENSHOTS/02-login-full.png). These do not describe the final authentication state.

## Appendix E. Exact captured console messages

34 unique captured events. Raw chronological records: [console-all-deduplicated.json](ADMIN-AUDIT-SCREENSHOTS/console-all-deduplicated.json). Full per-screen DOM/console snapshots: [live-evidence.json](ADMIN-AUDIT-SCREENSHOTS/live-evidence.json). Counts are limited to captured logs, not a guarantee that the browser retained every event.

| Exact first line | Captured occurrences |
|---|---|
| `Failed to load categories D: NG0200` | 8 |
| `Failed to load inventory D: NG0200` | 4 |
| `Failed to load users D: NG0200` | 4 |
| `Failed to load coupons D: NG0200` | 2 |
| `Failed to load rates D: NG0200` | 2 |
| `Refresh failed D: NG0200` | 1 |
| `Failed to load settings D: NG0200` | 4 |
| `Failed to load wishlist on session restore D: NG0200` | 2 |
| `Failed to load header categories D: NG0200` | 2 |
| `Failed to load products D: NG0200` | 5 |

### E.1. Failed to load categories D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-2LT2Y734.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:14:47.787+05:00`, `2026-10-17T00:22:21.528+05:00`.

```text
Failed to load categories D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.2. Failed to load inventory D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-6VEMAEYK.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:16:02.739+05:00`, `2026-10-17T00:16:48.279+05:00`, `2026-10-17T00:16:57.314+05:00`, `2026-10-17T00:22:45.146+05:00`.

```text
Failed to load inventory D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.3. Failed to load users D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-BLRP7UX7.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:17:26.034+05:00`, `2026-10-17T00:17:40.007+05:00`, `2026-10-17T00:17:40.043+05:00`, `2026-10-17T00:17:40.277+05:00`.

```text
Failed to load users D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.4. Failed to load coupons D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-OBPRUFVO.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:17:44.031+05:00`, `2026-10-17T00:18:13.531+05:00`.

```text
Failed to load coupons D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.5. Failed to load rates D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-YKJRF3D6.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:19:17.599+05:00`, `2026-10-17T00:22:20.364+05:00`.

```text
Failed to load rates D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.6. Refresh failed D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-YKJRF3D6.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:19:53.620+05:00`.

```text
Refresh failed D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.7. Failed to load settings D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-ZXWOD2MC.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:19:55.886+05:00`, `2026-10-17T00:20:56.562+05:00`, `2026-10-17T00:20:59.352+05:00`, `2026-10-17T00:22:00.894+05:00`.

```text
Failed to load settings D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.8. Failed to load wishlist on session restore D: NG0200

- Level: `warn`. Source: `https://www.beutepro.com/chunk-CUCYYQPM.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:20:58.852+05:00`, `2026-10-17T00:24:14.808+05:00`.

```text
Failed to load wishlist on session restore D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at <instance_members_initializer> (https://www.beutepro.com/main-FRXHMJYE.js:1:4694)
    at new a (https://www.beutepro.com/main-FRXHMJYE.js:1:4681)
    at Object.ɵfac [as factory] (https://www.beutepro.com/main-FRXHMJYE.js:1:5015)
    at Yt.hydrate (https://www.beutepro.com/chunk-JN4OD62H.js:4:7882)
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7121)
```

### E.9. Failed to load header categories D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/main-FRXHMJYE.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:20:58.856+05:00`, `2026-10-17T00:24:14.809+05:00`.

```text
Failed to load header categories D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.10. Failed to load categories D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-KGE45QQZ.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:22:46.962+05:00`, `2026-10-17T00:23:43.778+05:00`, `2026-10-17T00:24:08.327+05:00`.

```text
Failed to load categories D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.11. Failed to load products D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-KGE45QQZ.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:22:46.994+05:00`, `2026-10-17T00:23:43.778+05:00`, `2026-10-17T00:24:08.329+05:00`.

```text
Failed to load products D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.12. Failed to load categories D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-3PYLQDNC.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:22:58.051+05:00`.

```text
Failed to load categories D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.13. Failed to load categories D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-LQYGMYS5.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:24:36.333+05:00`, `2026-10-17T00:24:54.712+05:00`.

```text
Failed to load categories D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

### E.14. Failed to load products D: NG0200

- Level: `error`. Source: `https://www.beutepro.com/chunk-LQYGMYS5.js`.
- Captured at (Asia/Karachi): `2026-10-17T00:24:36.336+05:00`, `2026-10-17T00:24:54.712+05:00`.

```text
Failed to load products D: NG0200
    at Yt.get (https://www.beutepro.com/chunk-JN4OD62H.js:4:7248)
    at Yt.retrieve (https://www.beutepro.com/chunk-JN4OD62H.js:4:6344)
    at sE (https://www.beutepro.com/chunk-JN4OD62H.js:4:2309)
    at B (https://www.beutepro.com/chunk-JN4OD62H.js:4:2411)
    at g (https://www.beutepro.com/chunk-JN4OD62H.js:4:2444)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12442
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12282
    at Fn (https://www.beutepro.com/chunk-JN4OD62H.js:4:9485)
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12273
    at https://www.beutepro.com/chunk-JN4OD62H.js:5:12289
```

## Appendix F. Evidence limitations and tool diagnostics

- Chrome connection was unavailable; real in-app browser used.
- Some Page.navigate/locator commands timed out, but their destination later rendered. Those tooling observations are not recorded as HTTP4xx/5xx or conclusively dead application links.
- A read-only attempt to access the browser session from the inspection scope was unavailable. No token was read, printed or written. No unsupported authenticated API cleanup claim is made.
- No code changes, dev-server replacement, direct production write workaround, retry script, database repair or deployment was used.
- Unsaved draft cancellation and failure screenshots are kept; the requested successful CRUD/media lifecycle remains blocked and must not be inferred from them.
