<?php
/**
 * Checkout Form
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/form-checkout.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 9.4.0
 */

if (!defined('ABSPATH')) {
	exit;
}

do_action('woocommerce_before_checkout_form', $checkout);

// If checkout registration is disabled and not logged in, the user cannot checkout.
if (!$checkout->is_registration_enabled() && $checkout->is_registration_required() && !is_user_logged_in()) {
	echo esc_html(apply_filters('woocommerce_checkout_must_be_logged_in_message', __('You must be logged in to checkout.', 'woocommerce')));
	return;
}

?>
<style>
/* Fresh checkout styling - all new classes */
.new-checkout-container { display: grid; grid-template-columns: 1fr; gap: 2rem; max-width: 1400px; margin: 0 auto; padding: 2rem 1rem; }
.checkout-section { }
.billing-section { order: 1; }
.shipping-section { order: 2; }
.sidebar-section { order: 3; position: sticky; top: 2rem; align-self: start; }
.payment-section { order: 4; }
@media (min-width: 1024px) {
	.new-checkout-container { grid-template-columns: 2fr 1fr; gap: 3rem; }
	.billing-section { order: 1; grid-column: 1; }
	.shipping-section { order: 2; grid-column: 1; }
	.sidebar-section { order: 2; grid-column: 2; grid-row: 1 / span 4; height: fit-content; }
	.payment-section { order: 3; grid-column: 1; }
}
.checkout-field-block { background: #fff; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,0.08); border: 1px solid #e8e8e8; }
.checkout-payment-section { margin-top: 2rem; }
.checkout-field-block h3 { font-size: 1.4rem; font-weight: 600; margin: 0 0 1.5rem 0; color: #1a1a1a; border-bottom: 2px solid #f0f0f0; padding-bottom: 1rem; }
.new-checkout-form-area .form-row { margin-bottom: 1.5rem; }
.new-checkout-form-area .form-row.form-row-first,
.new-checkout-form-area .form-row.form-row-last { width: 100%; float: none; }
@media (min-width: 768px) {
	.new-checkout-form-area .form-row.form-row-first { float: left; width: 48%; margin-right: 4%; }
	.new-checkout-form-area .form-row.form-row-last { float: right; width: 48%; margin-right: 0; }
}
.new-checkout-form-area label { display: block; font-weight: 500; margin-bottom: 0.5rem; color: #333; font-size: 0.95rem; }
.new-checkout-form-area input, 
.new-checkout-form-area select, 
.new-checkout-form-area textarea { width: 100%; padding: 0.875rem 1.125rem; border: 1px solid #d1d1d1; border-radius: 6px; font-size: 1rem; background: #fff; transition: all 0.2s; }
.new-checkout-form-area input:focus, 
.new-checkout-form-area select:focus, 
.new-checkout-form-area textarea:focus { outline: none; border-color: #0073aa; box-shadow: 0 0 0 3px rgba(0,115,170,0.1); }
.sidebar-box { background: #f8f9fa; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
.sidebar-box h3 { font-size: 1.4rem; font-weight: 600; margin: 0 0 1.5rem 0; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 1rem; }
.sidebar-box table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
.sidebar-box table thead { display: none; }
.sidebar-box table tbody td { padding: 0.75rem 0; border-bottom: 1px solid #f0f0f0; }
.sidebar-box table tbody .product-name { padding-right: 1rem; font-size: 0.95rem; }
.sidebar-box table tbody .product-total { text-align: right; font-weight: 600; }
.sidebar-box table tbody .variation { margin: 0.25rem 0; font-size: 0.85rem; color: #666; }
.sidebar-box table tbody .variation dd { margin: 0; padding: 0; }
.sidebar-box table tfoot { border-top: 2px solid #e0e0e0; margin-top: 1rem; }
.sidebar-box table tfoot tr { border-bottom: 1px solid #f0f0f0; }
.sidebar-box table tfoot th, .sidebar-box table tfoot td { padding: 0.75rem 0; font-size: 0.95rem; }
.sidebar-box table tfoot .woocommerce-shipping-totals td { padding: 0.75rem 0; }
.sidebar-box table tfoot .order-total { border-top: 2px solid #1a1a1a; padding-top: 1rem; margin-top: 1rem; }
.sidebar-box table tfoot .order-total th, .sidebar-box table tfoot .order-total td { font-size: 1.3rem; font-weight: 700; }
.sidebar-box .woocommerce-shipping-methods { list-style: none; padding: 0; margin: 0.5rem 0; }
.sidebar-box .woocommerce-shipping-methods li { margin-bottom: 0.75rem; }
.sidebar-box .woocommerce-shipping-methods label { display: flex; align-items: center; padding: 0.75rem; background: #fff; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.sidebar-box .woocommerce-shipping-methods label:hover { border-color: #0073aa; background: #f8f9fa; }
.sidebar-box .woocommerce-shipping-methods input[type="radio"] { margin-right: 0.5rem; }
.payment-options-box { margin-top: 2rem; }
#place_order { width: 100%; padding: 1.125rem 2rem; background: #1a1a1a; color: #fff; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 1.5rem; }
#place_order:hover { background: #333; }
.new-checkout-form-area .woocommerce-form__label-for-checkbox { font-weight: 500; }
.new-checkout-form-area .woocommerce-form__input-checkbox { width: auto; margin-right: 0.5rem; }
.form-row#_field { display: none !important; }
.new-checkout-sidebar .checkout-payment-section {
  margin-top: 1.25rem;
  padding: 1.25rem;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
}
.woocommerce-checkout #payment ul.payment_methods{
    margin-top: 100px;
    }
@media (max-width: 968px) { 
	.sidebar-section { position: static !important; order: 3; }
	.new-checkout-form-area .form-row.form-row-first,
	.new-checkout-form-area .form-row.form-row-last { width: 100%; float: none; margin-right: 0; }
}
</style>

<form name="checkout" method="post" class="checkout woocommerce-checkout"
      action="<?php echo esc_url( wc_get_checkout_url() ); ?>" enctype="multipart/form-data"
      aria-label="<?php echo esc_attr__( 'Checkout', 'woocommerce' ); ?>">

  <div class="new-checkout-container">
    <div class="new-checkout-main">
      <?php if ( $checkout->get_checkout_fields() ) : ?>
        <?php do_action('woocommerce_checkout_before_customer_details'); ?>

        <div class="checkout-field-block">
          <h3><?php esc_html_e('Billing Details', 'woocommerce'); ?></h3>
          <?php do_action('woocommerce_checkout_billing'); ?>
        </div>

        <div class="checkout-field-block">
          <h3><?php esc_html_e('Shipping Details', 'woocommerce'); ?></h3>
          <?php do_action('woocommerce_checkout_shipping'); ?>
        </div>

        <?php do_action('woocommerce_checkout_after_customer_details'); ?>
      <?php endif; ?>
    </div>

    <div class="new-checkout-sidebar">
      <div class="sidebar-box">
        <h3><?php esc_html_e('Order Summary', 'woocommerce'); ?></h3>

        <?php do_action('woocommerce_checkout_before_order_review'); ?>
        <div id="order_review" class="woocommerce-checkout-review-order">
          <?php
          // With Option A (unhooked), this now renders ONLY the order table pieces.
          do_action('woocommerce_checkout_order_review');
          // If using Option B instead, replace the above line with:
          // woocommerce_order_review();
          ?>
        </div>
        <?php do_action('woocommerce_checkout_after_order_review'); ?>

        <!-- Payment inside the sidebar -->
        <div class="checkout-field-block checkout-payment-section">
          <h3><?php esc_html_e('Payment Method', 'woocommerce'); ?></h3>
          <div class="payment-options-box">
            <?php // These two lines are optional; payment.php already fires its own hooks. ?>
            <?php // do_action('woocommerce_checkout_before_payment'); ?>
            <?php woocommerce_checkout_payment(); ?>
            <?php // do_action('woocommerce_checkout_after_payment'); ?>
          </div>
        </div>
      </div>
    </div>
  </div> <!-- /.new-checkout-container -->

</form>


<?php do_action('woocommerce_after_checkout_form', $checkout); ?>
