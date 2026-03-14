<?php
/**
 * Add to Cart: Variable Subscription (delegates to variable.php)
 */
defined('ABSPATH') || exit;

$template = locate_template( 'woocommerce/single-product/add-to-cart/variable.php' );
if ( $template ) {
    include $template;
} else {
    wc_get_template( 'single-product/add-to-cart/variable.php' );
}
