# The Artisan WordPress Database Map

Snapshot date: `2026-03-01`

## Active Runtime and Credentials Source

- Active runtime root: `~/public_html`
- Credentials source of truth: `~/public_html/wp-config.php`
- Active DB host: `localhost`
- Active DB name: `theartis_wp1`
- Active DB user: `theartis_wp1`
- Table prefix: `wp_`

`DB_PASSWORD` is intentionally not documented here and must be read from the secure runtime config.

## Core WordPress Tables (Prefix `wp_`)

- `wp_options`
- `wp_posts`
- `wp_postmeta`
- `wp_users`
- `wp_usermeta`
- WooCommerce and plugin tables under the same prefix

## Artisan B2B Plugin Tables

Defined by plugin activator in `wp-content/plugins/artisan-b2b-portal/includes/class-ab2b-activator.php`.

- `wp_ab2b_customers`: customer profile and portal credentials
- `wp_ab2b_products`: product catalog rows used in B2B portal
- `wp_ab2b_product_weights`: product variants/weights/prices
- `wp_ab2b_orders`: B2B order header data
- `wp_ab2b_order_items`: B2B order line items
- `wp_ab2b_customer_products`: customer-product assignment table
- `wp_ab2b_customer_prices`: per-customer pricing overrides
- `wp_ab2b_categories`: B2B categories
- `wp_ab2b_product_categories`: product-category pivot

## Theme and Plugin State Keys

- Active parent theme: `template` option (`saren`)
- Active child theme: `stylesheet` option (`saren-child`)
- B2B plugin activation is tracked in serialized `active_plugins` option.

## Verification Commands (Read-Only)

Run through control plane:

- `GET /api/programs/artisan-wordpress/inventory`
- `POST /api/programs/artisan-wordpress/ssh-check` with `db_probe`
- `POST /api/programs/artisan-wordpress/ssh-check` with `theme_plugin`
