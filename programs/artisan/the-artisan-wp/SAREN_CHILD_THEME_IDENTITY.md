# Saren Child Theme Identity Guide

Theme stack:

- Parent: `saren`
- Child: `saren-child`

## Design Contract for The Artisan

1. Build visual changes in `saren-child` first.
2. Preserve existing class ecosystems (`sa-*`, `saren-*`, WooCommerce templates).
3. Reuse existing CSS variables and spacing rhythm.
4. Do not introduce conflicting visual language without explicit product request.

## Key Styling Primitives in Child Theme

Primary variables used throughout child theme CSS:

- `--mainColor`
- `--secondaryColor`
- `--mainBackground`
- `--secondaryBackground`
- `--linesColor`
- `--radius`

Common interaction patterns:

- brand button fills with `--mainColor`
- outlined buttons invert on hover
- bordered cards use `--linesColor` + `--secondaryBackground`
- article/guide modules use `sa-*` layout shells and utility components

## Implementation Rules

1. Prefer child-theme overrides before parent edits.
2. Keep WooCommerce template overrides inside `saren-child/woocommerce`.
3. Validate mobile + desktop behavior after each style change.
4. Keep B2B portal visual alignment consistent with Saren child styling tokens.

## Evidence Checklist for UI Tasks

- updated files list in `saren-child`
- before/after screenshots
- responsive checks (mobile + desktop)
- note of reused variables/components
