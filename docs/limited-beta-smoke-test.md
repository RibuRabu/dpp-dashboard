# Limited Beta Smoke Test Checklist

Run through each section after every deployment to production. Mark each item ✅ or ❌.

---

## 1. Public passport page (`/p/{slug}`)

- [ ] Navigate to a known `/p/{slug}` URL — page loads without error
- [ ] Product name, brand, and status pill render correctly
- [ ] Manufacturer section shows when manufacturer data exists
- [ ] Responsible operator section shows when data exists
- [ ] Target markets and compliance status (neutral label: Täydennetty / Kesken / Ei aloitettu) show under "Tuotetiedot"
- [ ] Materials list renders
- [ ] Compliance documents section shows with "Avaa ↗" links opening in new tab
- [ ] Copy buttons (⎘) copy to clipboard and show ✓ confirmation
- [ ] Skip link is focusable via Tab key and jumps to main content
- [ ] `/p/nonexistent-slug` shows "Tuotetta ei löytynyt." error message
- [ ] Page title updates to product name in browser tab

## 2. Owner edit page (`/owner/{token}`)

- [ ] Navigate to a valid `/owner/{token}` — page loads
- [ ] QR code canvas renders; "Lataa PNG" downloads a valid PNG
- [ ] "Julkinen ↗" link opens the correct `/p/{slug}` URL
- [ ] Edit a text field and click "Tallenna" — success message with new version number
- [ ] Select a different status (Julkaistu) and save — product updates
- [ ] File upload: select a PDF ≤10MB and click "Lähetä" — doc appears in list
- [ ] Uploaded document link opens in new tab
- [ ] Translation tab: enter English text and save — success with version bump
- [ ] Skip link is focusable

## 3. Dashboard — authentication

- [ ] Navigate to `/dashboard/products` without being logged in — redirected to `/sign-in`
- [ ] Navigate to `/platform/billing` without being logged in — redirected to `/sign-in`
- [ ] Sign in with a valid account — redirected to `/dashboard/products`
- [ ] Landing page `/` when signed in — redirects to `/dashboard/products`
- [ ] Landing page `/` when signed out — marketing page renders correctly

## 4. Dashboard — products

- [ ] `/dashboard/products` loads the product list
- [ ] "+ Uusi tuote" button is visible and navigates to `/dashboard/products/new`
- [ ] Creating a new product succeeds and redirects to the edit page
- [ ] Product list shows product name, status badge, version, last updated
- [ ] "Muokkaa →" link opens the product edit page

## 5. Dashboard — product edit page

- [ ] All 6 tabs are accessible (Perustiedot, Listat, Käännökset, Dokumentit, Jakaminen, EU-vaatimukset)
- [ ] Tab keyboard navigation: Arrow keys move focus between tabs; Enter/Space activates
- [ ] Editing a field and switching tab shows "Tallentamattomia muutoksia" warning banner
- [ ] Attempting to navigate away with unsaved changes triggers browser beforeunload dialog
- [ ] Saving clears the unsaved-changes warning
- [ ] EU-vaatimukset tab loads compliance check with score and missing fields list
- [ ] "Korjaa →" button on a missing field navigates to the correct tab
- [ ] Dokumentit tab: upload a file, it appears in the list
- [ ] Jakaminen tab: copy public link to clipboard works
- [ ] "Arkistoi" button asks for confirmation before archiving

## 6. Legal pages

- [ ] `/legal/tietosuoja` renders — no `[PLACEHOLDER]` visible in live content
- [ ] `/legal/kayttoehdot` renders
- [ ] `/legal/peruutusehdot` renders
- [ ] `/legal/tietojenkasittely` renders
- [ ] `/hinnoittelu` renders with correct prices (29€/kk Starter, 79€/kk Pro)
- [ ] All legal pages reachable from footer of landing page

## 7. API — public endpoints

- [ ] `GET /api/public/product/{slug}` returns 200 with correct JSON for a known slug
- [ ] `GET /api/public/product/nonexistent` returns 404
- [ ] `GET /api/passport/{product_uid}` returns 200 for a known product
- [ ] CORS: request from allowed origin receives correct `Access-Control-Allow-Origin` header
- [ ] CORS: request from unlisted origin receives no CORS headers (request blocked by browser)

## 8. API — authenticated endpoints

- [ ] `GET /api/tenant/products` with valid JWT returns product list
- [ ] `GET /api/tenant/products` with no Authorization header returns 401
- [ ] `POST /api/tenant/product` with valid JWT creates product and returns new product data
- [ ] `POST /api/tenant/product/{slug}` with valid JWT updates product

## 9. Security headers

Run: `curl -I https://digitaalinentuotepassi.tulkintatila.fi` and verify:
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## 10. Accessibility spot-check

- [ ] Tab through the landing page: focus order is logical (header → main → footer)
- [ ] Tab through a product edit page: all inputs, buttons, and tabs are reachable
- [ ] Screen reader: heading hierarchy H1 → H2 → H3 on landing page is correct
- [ ] All images/icons used decoratively have `aria-hidden="true"` or empty alt text
- [ ] Copy buttons have descriptive `aria-label` (visible in browser accessibility tree)

---

**Pass criteria for Limited Beta launch:** All items in sections 1–5 and 7–8 must pass. Section 9 must have at least 3 of 5 headers present. Section 6: placeholders must be filled. Section 10: sections 1–2 of accessibility check pass.
