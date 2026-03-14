<?php
/**
 * External product add to cart
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/add-to-cart/external.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.0.1
 */

defined('ABSPATH') || exit;

do_action('woocommerce_before_add_to_cart_form'); ?>

<form class="saren--cart--form cart" action="<?php echo esc_url($product_url); ?>" method="get">
	<?php do_action('woocommerce_before_add_to_cart_button'); ?>

	<button type="submit"
		class="single_add_to_cart_button external_add_to_cart button alt<?php echo esc_attr(wc_wp_theme_get_element_class_name('button') ? ' ' . wc_wp_theme_get_element_class_name('button') : ''); ?>"><?php echo esc_html($button_text); ?>
		<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
			<path d="m243-240-51-51 405-405H240v-72h480v480h-72v-357L243-240Z" />
		</svg>
	</button>

	<?php wc_query_string_form_fields($product_url); ?>

	<?php do_action('woocommerce_after_add_to_cart_button'); ?>
</form>

<?php do_action('woocommerce_after_add_to_cart_form'); ?>