<?php
/**
 * Checkout billing information form
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/form-billing.php.
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


<div class="woocommerce-billing-fields">

	<?php
	if (is_customer_address_complete($checkout, 'billing')) { ?>

		<div class="saren--address--card billing">

			<div class="address--card--wrapper">

				<p class="adress-card-name">
					<?php echo esc_html__(WC()->customer->get_billing_first_name() . ' ' . WC()->customer->get_billing_last_name()) ?>
				</p>
				<?php if (WC()->customer->get_billing_phone() || WC()->customer->get_billing_email()) { ?>
					<p class="adress-card-phone-email">
						<?php echo '<span>' . esc_html__(WC()->customer->get_billing_phone()) . '</span>' ?>
						<?php echo '<span>-</span>' ?>
						<?php echo '<span>' . esc_html__(WC()->customer->get_billing_email()) . '</span>' ?>
					</p>
				<?php } ?>
				<p class="address-card-street">
					<?php echo esc_html__(WC()->customer->get_billing_address() . ' ' . WC()->customer->get_billing_address_2() . ' ,' . WC()->customer->get_billing_city()) ?>
				</p>
				<p class="address-card-country">
					<?php
					$country_code = WC()->customer->get_billing_country();
					$countries = WC()->countries->countries;
					$country_name = isset($countries[$country_code]) ? $countries[$country_code] : $country_code;
					$state_code = WC()->customer->get_billing_state();     // Örneğin: 06
					$states = WC()->countries->get_states($country_code);
					$state_name = isset($states[$state_code]) ? $states[$state_code] : $state_code;

					echo esc_html__(WC()->customer->get_billing_postcode() . '/' . $state_name . '/' . $country_name) ?>
				</p>

			</div>
			<div class="address-card--edit" data-edit="#billing_address_fields">
				<?php
				echo '<span class="edit--edit">' . file_get_contents(get_template_directory(). '/assets/img/edit.svg') . '</span>';
				echo '<span class="edit--close">' . file_get_contents(get_template_directory(). '/assets/img/remove.svg') . '</span>';
				?>
			</div>

		</div>

	<?php } ?>

	<div id="billing_address_fields">
		<?php
		do_action('woocommerce_before_checkout_billing_form', $checkout);
		foreach ($checkout->get_checkout_fields('billing') as $key => $field) {
			woocommerce_form_field($key, $field, $checkout->get_value($key));
		}
		do_action('woocommerce_after_checkout_billing_form', $checkout);
		?>
	</div>
</div>

<?php if (!is_user_logged_in() && $checkout->is_registration_enabled()): ?>
	<div class="woocommerce-account-fields">
		<?php if (!$checkout->is_registration_required()): ?>

			<p class="form-row form-row-wide create-account">
				<label class="woocommerce-form__label woocommerce-form__label-for-checkbox checkbox">
					<input class="woocommerce-form__input woocommerce-form__input-checkbox input-checkbox" id="createaccount"
						<?php checked((true === $checkout->get_value('createaccount') || (true === apply_filters('woocommerce_create_account_default_checked', false))), true); ?> type="checkbox"
						name="createaccount" value="1" />
					<span><?php esc_html_e('Create an account?', 'woocommerce'); ?></span>
				</label>
			</p>

		<?php endif; ?>

		<?php do_action('woocommerce_before_checkout_registration_form', $checkout); ?>

		<?php if ($checkout->get_checkout_fields('account')): ?>

			<div class="create-account">
				<?php foreach ($checkout->get_checkout_fields('account') as $key => $field): ?>
					<?php woocommerce_form_field($key, $field, $checkout->get_value($key)); ?>
				<?php endforeach; ?>
				<div class="clear"></div>
			</div>

		<?php endif; ?>

		<?php do_action('woocommerce_after_checkout_registration_form', $checkout); ?>
	</div>
<?php endif; ?>