<?php
/**
 * My Account navigation
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/myaccount/navigation.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 9.3.0
 */

if (!defined('ABSPATH')) {
	exit;
}

do_action('woocommerce_before_account_navigation');

$icons = [
	'dashboard' => '<span class="acc--nav--icon">' . file_get_contents(get_template_directory(). '/assets/img/dashboard.svg') . '</span>',
	'orders' => '<span class="acc--nav--icon">' . file_get_contents(get_template_directory(). '/assets/img/orders.svg') . '</span>',
	'edit-account' => '<span class="acc--nav--icon">' . file_get_contents(get_template_directory(). '/assets/img/edit_account.svg') . '</span>',
	'downloads' => '<span class="acc--nav--icon">' . file_get_contents(get_template_directory(). '/assets/img/downloads.svg') . '</span>',
	'edit-address' => '<span class="acc--nav--icon">' . file_get_contents(get_template_directory(). '/assets/img/addresses.svg') . '</span>',
	'subscriptions' => '<span class="acc--nav--icon">' . file_get_contents(get_template_directory(). '/assets/img/subscriptions.svg') . '</span>',
	'payment-methods' => '<span class="acc--nav--icon">' . file_get_contents(get_template_directory(). '/assets/img/payments.svg') . '</span>',
	'customer-logout' => '<span class="acc--nav--icon">' . file_get_contents(get_template_directory(). '/assets/img/logout.svg') . '</span>',
];

?>


<nav class="woocommerce-MyAccount-navigation" data-barba-prevent="all">
	<ul>
		<?php foreach (wc_get_account_menu_items() as $endpoint => $label): ?>
			<li class="<?php echo wc_get_account_menu_item_classes($endpoint); ?>">
				<a href="<?php echo esc_url(wc_get_account_endpoint_url($endpoint)); ?>"><?php echo _e($icons[$endpoint]) ?>
					<?php echo esc_html($label); ?></a>
			</li>
		<?php endforeach; ?>
	</ul>
</nav>

<?php do_action('woocommerce_after_account_navigation'); ?>