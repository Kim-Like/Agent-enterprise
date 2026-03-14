<?php
/**
 * "Order received" message.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/order-received.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 8.8.0
 *
 * @var WC_Order|false $order
 */

defined('ABSPATH') || exit;
$option = get_option('pe-redux');
?>


<div class="order--thankyou-wrap">


	<?php $mainLogo = $option['main_site_logo']['id'];
	$secondaryLogo = $option['secondary_site_logo']['id']; ?>
	<!-- Site Logo -->
	<div class="site-logo">

		<a href="<?php echo esc_url(home_url('/')); ?>">

			<?php

			echo wp_get_attachment_image($mainLogo, $size, false, array("class" => "main__logo"));
			echo wp_get_attachment_image($secondaryLogo, $size, false, array("class" => "secondary__logo"));
			?>

		</a>

	</div>
	<!--/ Site Logo -->

	<p class="text-h4 woocommerce-notice woocommerce-notice--success woocommerce-thankyou-order-received">

		<?php $svgPath = get_template_directory() . '/assets/img/check.svg';
		$icon = file_get_contents($svgPath);
		echo '<span class="order--completed--icon">' . $icon . '</span>'; ?>

		<?php
		/**
		 * Filter the message shown after a checkout is complete.
		 *
		 * @since 2.2.0
		 *
		 * @param string         $message The message.
		 * @param WC_Order|false $order   The order created during checkout, or false if order data is not available.
		 */
		$message = apply_filters(
			'woocommerce_thankyou_order_received_text',
			esc_html__(__('Thank you. Your order has been received.', 'woocommerce')),
			$order
		);

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<span class="order--completed--text">' . esc_html__($message);
		echo '<span class="order--number">' . esc_html__('Order number: ', 'woocommerce');
		echo esc_html__($order->get_order_number());
		echo '</span>';

		?>
	</p>



</div>