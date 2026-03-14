<?php
/**
 * Login Form
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/myaccount/form-login.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 9.9.0
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}

do_action('woocommerce_before_customer_login_form'); ?>

<div class="section">

	<div class="pe-wrapper saren--login--page--wrapper">
		<?php if ('yes' === get_option('woocommerce_enable_myaccount_registration')) { ?>
			<div class="pe-col6 sm-12 col-center">
				<?php echo do_shortcode('[saren_login_register]'); ?>
			</div>
		<?php } ?>
	</div>
</div>


<?php do_action('woocommerce_after_customer_login_form'); ?>