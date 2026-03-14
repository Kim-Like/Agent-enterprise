# Artisan B2B Portal Function Map

Plugin path: `wp-content/plugins/artisan-b2b-portal`

## Core Runtime

- Entry plugin: `artisan-b2b-portal.php`
- Current plugin version constant: `AB2B_VERSION`
- Namespace for REST: `ab2b/v1`

## Main Modules

- `includes/admin/class-ab2b-admin.php`
  - Admin menus/submenus
  - AJAX handlers for customer/order/product operations
- `includes/public/class-ab2b-public.php`
  - Frontend shortcodes and portal rendering
  - Access checks and asset enqueue
- `includes/api/class-ab2b-rest-api.php`
  - REST routes for products, customer profile/password, orders, settings, categories
- `includes/core/*`
  - Customer, order, product, category, pricing, helper, email services

## Frontend Entry Points

Shortcodes:

- `[ab2b_portal]`
- `[ab2b_shop]`
- `[ab2b_cart]`
- `[ab2b_orders]`

Templates:

- `templates/portal/portal.php`
- `templates/portal/shop.php`
- `templates/portal/cart.php`
- `templates/portal/orders.php`

## REST Endpoints (Customer Access-Key Protected)

- `GET /wp-json/ab2b/v1/products`
- `GET /wp-json/ab2b/v1/products/{id}`
- `GET|PUT /wp-json/ab2b/v1/customer`
- `POST /wp-json/ab2b/v1/customer/password`
- `GET|POST /wp-json/ab2b/v1/orders`
- `GET|PUT|DELETE /wp-json/ab2b/v1/orders/{id}`
- `GET /wp-json/ab2b/v1/settings`
- `GET /wp-json/ab2b/v1/categories`

## Access and Auth Model

- Customer APIs use `X-AB2B-Access-Key` or `access_key` query parameter.
- Invalid/missing keys return `401`.
- Admin actions use WordPress capability checks + nonce verification.

## Operational Ownership

- Day-to-day queue owner: `artisan-master`
- Implementation specialist: `spec.artisan.wp_b2b`
- Escalation owner: `engineer`
