<?php
/**
 * Checkout shipping information form
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/form-shipping.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.6.0
 * @global WC_Checkout $checkout
 */

defined('ABSPATH') || exit;
?>

<div class="woocommerce-shipping-fields">
	<?php if (true === WC()->cart->needs_shipping_address()): ?>
		<!-- <p id="ship-to-different-address">
			<label class="woocommerce-form__label woocommerce-form__label-for-checkbox checkbox">
				<input id="ship-to-different-address-checkbox"
					class="woocommerce-form__input woocommerce-form__input-checkbox input-checkbox" <?php checked(apply_filters('woocommerce_ship_to_different_address_checked', 'shipping' === get_option('woocommerce_ship_to_destination') ? 1 : 0), 1); ?> type="checkbox"
					name="ship_to_different_address" value="1" />
				<span> -->
		<?php //esc_html_e('Ship to a different address?', 'woocommerce'); ?>
		<!-- </span>
			</label>
		</p> -->

		<?php
		if (is_customer_address_complete($checkout, 'shipping')) { ?>

			<div class="saren--address--card shipping">

				<div class="address--card--wrapper">

					<p class="adress-card-name">
						<?php echo esc_html__(WC()->customer->get_shipping_first_name() . ' ' . WC()->customer->get_shipping_last_name()) ?>
					</p>
					<?php if (WC()->customer->get_billing_phone() || WC()->customer->get_billing_email()) { ?>
						<p class="adress-card-phone-email">
							<?php echo '<span>' . esc_html__(WC()->customer->get_billing_phone()) . '</span>' ?>
							<?php echo '<span>-</span>' ?>
							<?php echo '<span>' . esc_html__(WC()->customer->get_billing_email()) . '</span>' ?>
						</p>
					<?php } ?>
					<p class="address-card-street">
						<?php echo esc_html__(WC()->customer->get_shipping_address() . ' ' . WC()->customer->get_shipping_address_2() . ' ,' . WC()->customer->get_shipping_city()) ?>
					</p>
					<p class="address-card-country">
						<?php
						$country_code = WC()->customer->get_shipping_country();
						$countries = WC()->countries->countries;
						$country_name = isset($countries[$country_code]) ? $countries[$country_code] : $country_code;
						$state_code = WC()->customer->get_shipping_state();     // Örneğin: 06
						$states = WC()->countries->get_states($country_code);
						$state_name = isset($states[$state_code]) ? $states[$state_code] : $state_code;

						echo esc_html__(WC()->customer->get_shipping_postcode() . '/' . $state_name . '/' . $country_name) ?>
					</p>

				</div>

			</div>

		<?php } ?>
		<div class="shipping_address">

			<?php do_action('woocommerce_before_checkout_shipping_form', $checkout); ?>

			<div class="woocommerce-shipping-fields__field-wrapper">
				<?php
				$fields = $checkout->get_checkout_fields('shipping');

				foreach ($fields as $key => $field) {
					woocommerce_form_field($key, $field, $checkout->get_value($key));
				}
				?>
			</div>

			<?php do_action('woocommerce_after_checkout_shipping_form', $checkout); ?>

		</div>

	<?php endif; ?>
</div>