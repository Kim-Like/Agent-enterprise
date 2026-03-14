# Style Skill — comparaja.pt Standalone Design System

## Core Rule
Every class you use in HTML must have its CSS defined in the `css` output field.
Do not reference any class from the site's existing stylesheet.

---

## Container & Section

Every component begins with a section → wrap pair:

```html
<section class="cja-proto-COMPONENT__section">
  <div class="cja-proto-COMPONENT__wrap">
    <!-- content -->
  </div>
</section>
```

```css
.cja-proto-COMPONENT__section {
  padding: 48px 0;
}
.cja-proto-COMPONENT__wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}
```

---

## Section Heading

```html
<div class="cja-proto-COMPONENT__heading">
  <h2>Heading Text</h2>
  <p>Supporting description paragraph.</p>
</div>
```

```css
.cja-proto-COMPONENT__heading {
  text-align: center;
  margin-bottom: 32px;
}
.cja-proto-COMPONENT__heading h2 {
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: clamp(26px, 4vw, 40px);
  font-weight: 800;
  background: linear-gradient(90deg, #0d2745 0%, #076b9c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
  line-height: 1.15;
}
.cja-proto-COMPONENT__heading p {
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}
```

---

## Panel / Card

Creates a white card with border, shadow, and padding. Required around all form/tool content.

```css
.cja-proto-COMPONENT__panel {
  background: #fff;
  border: 1px solid #dedede;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}
@media (max-width: 767px) {
  .cja-proto-COMPONENT__panel {
    padding: 20px 16px;
    border-radius: 12px;
  }
}
```

---

## ⚠️ Design Mandate — Enforced Layout Rules

> **For complex forms (3+ input fields) use the Split Layout to keep results visible.** Never place all inputs and results in a single stacked column on desktop.
>
> **2+ result values → use Hero Stat + Stat Bar**, not a plain list of text.
>
> **Every results panel MUST include at least one visual enrichment element** beyond plain text: a proportion bar, a hero stat block, or a stat bar.

---

## Pattern A — Split Layout: Form Left + Results Right

**Use for: any calculator, simulator, or tool with 3 or more input fields.**

Form inputs on the left (7/12 width). Sticky results panel on the right (5/12). On mobile both stack.

```html
<section class="cja-proto-COMPONENT__section">
  <div class="cja-proto-COMPONENT__wrap">
    <div class="cja-proto-COMPONENT__heading">
      <h2>Section Heading</h2>
      <p>Supporting description paragraph.</p>
    </div>
    <div class="cja-proto-COMPONENT__split">
      <div class="cja-proto-COMPONENT__panel">
        <!-- form fields + submit button -->
      </div>
      <div class="cja-proto-COMPONENT__results-panel">
        <!-- hero stat + stat bar + proportion bar -->
      </div>
    </div>
  </div>
</section>
```

```css
.cja-proto-COMPONENT__split {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 900px) {
  .cja-proto-COMPONENT__split { grid-template-columns: 1fr; }
}
.cja-proto-COMPONENT__results-panel {
  position: sticky;
  top: 80px;
  background: #fff;
  border: 1px solid #dedede;
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
```

---

## Pattern B — Single-Column Layout

Use for: content sections, FAQ, simple 1–2 field tools.

```html
<section class="cja-proto-COMPONENT__section">
  <div class="cja-proto-COMPONENT__wrap">
    <div class="cja-proto-COMPONENT__heading"><h2>…</h2></div>
    <div class="cja-proto-COMPONENT__panel">
      <!-- content -->
    </div>
  </div>
</section>
```

---

## Pattern C — Multi-Column Cards Grid

Use for: result listings, feature grids, comparison cards.

```html
<section class="cja-proto-COMPONENT__section">
  <div class="cja-proto-COMPONENT__wrap">
    <div class="cja-proto-COMPONENT__heading"><h2>…</h2></div>
    <div class="cja-proto-COMPONENT__grid">
      <div class="cja-proto-COMPONENT__card"><!-- card 1 --></div>
      <div class="cja-proto-COMPONENT__card"><!-- card 2 --></div>
      <div class="cja-proto-COMPONENT__card"><!-- card 3 --></div>
    </div>
  </div>
</section>
```

```css
.cja-proto-COMPONENT__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
.cja-proto-COMPONENT__card {
  background: #fff;
  border: 1px solid #dedede;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}
.cja-proto-COMPONENT__card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
```

---

## Two-Column Field Row

Use inside a panel to place 2 logically related fields side by side (e.g., amount + duration, rate + term).

```html
<div class="cja-proto-COMPONENT__field-row">
  <div class="cja-proto-COMPONENT__field">
    <label class="cja-proto-COMPONENT__label" for="field1">Label 1</label>
    <!-- input -->
  </div>
  <div class="cja-proto-COMPONENT__field">
    <label class="cja-proto-COMPONENT__label" for="field2">Label 2</label>
    <!-- input -->
  </div>
</div>
```

```css
.cja-proto-COMPONENT__field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 767px) {
  .cja-proto-COMPONENT__field-row { grid-template-columns: 1fr; }
}
```

---

## Form Fields

Required CSS for every form component.

```html
<div class="cja-proto-COMPONENT__fields">
  <div class="cja-proto-COMPONENT__field">
    <label class="cja-proto-COMPONENT__label" for="fieldId">Label</label>
    <input class="cja-proto-COMPONENT__input" id="fieldId" type="text" placeholder="Placeholder" />
  </div>
  <!-- Select -->
  <div class="cja-proto-COMPONENT__field">
    <label class="cja-proto-COMPONENT__label" for="selectId">Label</label>
    <select class="cja-proto-COMPONENT__input" id="selectId">
      <option value="">Selecionar opção</option>
    </select>
  </div>
</div>
```

```css
.cja-proto-COMPONENT__fields {
  display: grid;
  gap: 16px;
}
.cja-proto-COMPONENT__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cja-proto-COMPONENT__label {
  display: block;
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #0d2745;
  margin: 0;
}
.cja-proto-COMPONENT__input {
  width: 100%;
  border: 1px solid #dedede;
  border-radius: 8px;
  padding: 0 12px;
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 16px;
  height: 44px;
  background: #fff;
  color: #0d2745;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}
.cja-proto-COMPONENT__input:focus {
  outline: none;
  border-color: #076b9c;
  box-shadow: 0 0 0 3px rgba(7, 107, 156, 0.15);
}
.cja-proto-COMPONENT__input::placeholder { color: #979290; }
.cja-proto-COMPONENT__input.error { border-color: #ef4444; }
```

---

## Input with Prefix/Suffix (€, %, anos)

Always use for currency, rate, and time fields.

```html
<!-- Prefix (€) -->
<div class="cja-proto-COMPONENT__input-wrap">
  <span class="cja-proto-COMPONENT__input-affix">€</span>
  <input class="cja-proto-COMPONENT__input cja-proto-COMPONENT__input--bare" type="number" placeholder="0" />
</div>

<!-- Suffix (% or anos) -->
<div class="cja-proto-COMPONENT__input-wrap">
  <input class="cja-proto-COMPONENT__input cja-proto-COMPONENT__input--bare" type="number" placeholder="0" />
  <span class="cja-proto-COMPONENT__input-affix">%</span>
</div>
```

```css
.cja-proto-COMPONENT__input-wrap {
  display: flex;
  align-items: stretch;
  border: 1px solid #dedede;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.2s ease;
}
.cja-proto-COMPONENT__input-wrap:focus-within {
  border-color: #076b9c;
  box-shadow: 0 0 0 3px rgba(7, 107, 156, 0.15);
}
.cja-proto-COMPONENT__input-affix {
  padding: 0 12px;
  color: #979290;
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 14px;
  font-weight: 700;
  background: #f4f9fc;
  border-right: 1px solid #dedede;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.cja-proto-COMPONENT__input-wrap .cja-proto-COMPONENT__input-affix:last-child {
  border-right: none;
  border-left: 1px solid #dedede;
}
.cja-proto-COMPONENT__input--bare {
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  flex: 1;
}
```

---

## Buttons (fully standalone — no site class dependency)

```html
<button class="cja-proto-btn cja-proto-btn--primary" type="button">Calcular</button>
<button class="cja-proto-btn cja-proto-btn--orange" type="button">Simular Agora</button>
<button class="cja-proto-btn cja-proto-btn--outline" type="button">Ver Detalhes</button>
<button class="cja-proto-btn cja-proto-btn--ghost" type="button">Limpar</button>
```

```css
.cja-proto-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 24px;
  border-radius: 8px;
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
  white-space: nowrap;
  text-decoration: none;
  letter-spacing: 0.1px;
}
.cja-proto-btn--primary {
  background: #076b9c;
  color: #fff;
}
.cja-proto-btn--primary:hover { background: #155072; }

.cja-proto-btn--orange {
  background: #f58423;
  color: #fff;
}
.cja-proto-btn--orange:hover { opacity: 0.88; }

.cja-proto-btn--outline {
  background: transparent;
  color: #076b9c;
  border: 1.5px solid #076b9c;
}
.cja-proto-btn--outline:hover { background: #e6f1f9; }

.cja-proto-btn--ghost {
  background: transparent;
  color: #076b9c;
  border: none;
}
.cja-proto-btn--ghost:hover { text-decoration: underline; }

.cja-proto-btn--sm { height: 36px; padding: 0 16px; font-size: 13px; }
.cja-proto-btn--lg { height: 56px; padding: 0 32px; font-size: 17px; }
```

---

## Actions Row

```html
<div class="cja-proto-COMPONENT__actions">
  <button class="cja-proto-btn cja-proto-btn--primary" type="button">Calcular</button>
  <button class="cja-proto-btn cja-proto-btn--ghost" type="reset">Limpar</button>
</div>
```

```css
.cja-proto-COMPONENT__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  flex-wrap: wrap;
}
```

---

## Hero Stat Block (large primary metric)

First element in the results panel. One large number with label and subtitle.

```html
<div class="cja-proto-COMPONENT__hero">
  <div class="cja-proto-COMPONENT__hero-label">Pagamento Mensal</div>
  <div class="cja-proto-COMPONENT__hero-value" id="monthlyPayment">€ 0,00</div>
  <div class="cja-proto-COMPONENT__hero-sub">estimativa baseada nos dados inseridos</div>
</div>
```

```css
.cja-proto-COMPONENT__hero {
  background: linear-gradient(135deg, #076b9c 0%, #0d2745 100%);
  border-radius: 14px;
  padding: 28px 24px;
  text-align: center;
  margin-bottom: 20px;
}
.cja-proto-COMPONENT__hero-label {
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
}
.cja-proto-COMPONENT__hero-value {
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 42px;
  font-weight: 800;
  color: #b5e187;
  line-height: 1.1;
  margin-bottom: 8px;
}
.cja-proto-COMPONENT__hero-sub {
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
```

---

## Stat Bar (2–3 secondary metrics)

Goes below the hero stat. Horizontal row with dividers between values.

```html
<div class="cja-proto-COMPONENT__stat-bar">
  <div class="cja-proto-COMPONENT__stat">
    <div class="cja-proto-COMPONENT__stat-label">Total de Juros</div>
    <div class="cja-proto-COMPONENT__stat-value" id="totalInterest">€ 0,00</div>
  </div>
  <div class="cja-proto-COMPONENT__stat">
    <div class="cja-proto-COMPONENT__stat-label">Montante Total</div>
    <div class="cja-proto-COMPONENT__stat-value" id="totalAmount">€ 0,00</div>
  </div>
</div>
```

```css
.cja-proto-COMPONENT__stat-bar {
  display: flex;
  border: 1px solid #dedede;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}
.cja-proto-COMPONENT__stat {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cja-proto-COMPONENT__stat + .cja-proto-COMPONENT__stat {
  border-left: 1px solid #dedede;
}
.cja-proto-COMPONENT__stat-label {
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #979290;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.cja-proto-COMPONENT__stat-value {
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #0d2745;
}
```

---

## Proportion Bar (CSS-only split bar, no canvas)

Visually shows how total cost is split. JS sets `flex` values dynamically.

```html
<div class="cja-proto-COMPONENT__split-bar">
  <div class="cja-proto-COMPONENT__split-capital" id="splitCapital" style="flex: 70"></div>
  <div class="cja-proto-COMPONENT__split-interest" id="splitInterest" style="flex: 30"></div>
</div>
<div class="cja-proto-COMPONENT__split-legend">
  <span class="cja-proto-COMPONENT__split-dot cja-proto-COMPONENT__split-dot--capital">Capital</span>
  <span class="cja-proto-COMPONENT__split-dot cja-proto-COMPONENT__split-dot--interest">Juros</span>
</div>
```

```css
.cja-proto-COMPONENT__split-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  margin: 16px 0 8px;
  background: #f4f9fc;
}
.cja-proto-COMPONENT__split-capital {
  background: #076b9c;
  transition: flex 0.4s ease;
}
.cja-proto-COMPONENT__split-interest {
  background: #b5e187;
  transition: flex 0.4s ease;
}
.cja-proto-COMPONENT__split-legend {
  display: flex;
  gap: 16px;
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 12px;
  color: #979290;
}
.cja-proto-COMPONENT__split-dot::before {
  content: '●';
  margin-right: 6px;
}
.cja-proto-COMPONENT__split-dot--capital::before { color: #076b9c; }
.cja-proto-COMPONENT__split-dot--interest::before { color: #b5e187; }
```

In JS: `splitCapital.style.flex = capitalPct; splitInterest.style.flex = 100 - capitalPct;`

---

## Pill Toggle (styled radio buttons)

Use for 2–4 mutually exclusive options (e.g., fixed vs variable rate).

```html
<div class="cja-proto-COMPONENT__pills">
  <label class="cja-proto-COMPONENT__pill">
    <input type="radio" name="rateType" value="fixed" checked hidden>
    <span>Taxa Fixa</span>
  </label>
  <label class="cja-proto-COMPONENT__pill">
    <input type="radio" name="rateType" value="variable" hidden>
    <span>Taxa Variável</span>
  </label>
</div>
```

```css
.cja-proto-COMPONENT__pills {
  display: flex;
  background: #f4f9fc;
  border: 1px solid #dedede;
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
}
.cja-proto-COMPONENT__pill span {
  display: block;
  padding: 8px 20px;
  border-radius: 7px;
  font-family: Nunito Sans, Helvetica, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #979290;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.cja-proto-COMPONENT__pill input:checked + span {
  background: #076b9c;
  color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
```

---

## Section Divider with Label

Separates form inputs from results within a single-panel layout.

```html
<div class="cja-proto-COMPONENT__divider"><span>Resultados da Simulação</span></div>
```

```css
.cja-proto-COMPONENT__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 20px;
  font-family: Nunito Sans, Helvetica, sans-serif;
  color: #979290;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.cja-proto-COMPONENT__divider::before,
.cja-proto-COMPONENT__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #dedede;
}
```

---

## Design Token Reference

| Token | Value |
|-------|-------|
| Primary blue | `#076b9c` |
| Dark blue | `#0d2745` |
| Mid blue (hover) | `#155072` |
| Light blue bg | `#e6f1f9` |
| Light blue tint | `#f4f9fc` |
| Orange | `#f58423` |
| Green | `#77aa43` |
| Light green | `#b5e187` |
| Border | `#dedede` |
| Placeholder | `#979290` |
| Error | `#ef4444` |
| Body font | `Nunito Sans, Helvetica, sans-serif` |
| Input/button height | `44px` |
| Border radius — inputs/buttons | `8px` |
| Border radius — cards/panels | `16px` |
| Card shadow | `0 2px 10px rgba(0,0,0,0.1)` |
| Hover shadow | `0 4px 20px rgba(0,0,0,0.1)` |

Spacing scale: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px`

---

## Creative Freedom

The patterns above are building blocks. Mix, match, and nest them creatively. You can invent new visual
arrangements as long as you use the design tokens above and define all CSS in the output field.
