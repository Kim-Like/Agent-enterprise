<?php
/**
 * Show messages
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/notices/success.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 8.6.0
 */

if (!defined('ABSPATH')) {
	exit;
}

if (!$notices) {
	return;
}

?>

<?php foreach ($notices as $notice): ?>
	<div class="woocommerce-message saren--woo--message" <?php echo wc_get_notice_data_attr($notice); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> role="alert">

		<span class="message--close">
			<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
				<path
					d="m291-240-51-51 189-189-189-189 51-51 189 189 189-189 51 51-189 189 189 189-51 51-189-189-189 189Z" />
			</svg>
		</span>

		<span class="message--timer"></span>

		<?php echo wc_kses_notice($notice['notice']); ?>
		
		<a href="<?php echo wc_get_cart_url(); ?>" data-barba-prevent="all"
			class="button saren--woo--button saren-view-cart">
			<?php echo esc_html_e('VIEW CART', 'saren'); ?>
			<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
				<path d="m243-240-51-51 405-405H240v-72h480v480h-72v-357L243-240Z" />
			</svg>
		</a>

	</div>
<?php endforeach; ?>