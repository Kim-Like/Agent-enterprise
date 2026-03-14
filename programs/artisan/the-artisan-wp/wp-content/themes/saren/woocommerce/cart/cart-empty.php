<?php
/**
 * Empty cart page
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/cart-empty.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.9.0
 */

defined('ABSPATH') || exit;

/*
 * @hooked wc_empty_cart_message - 10
 */

if (class_exists('Redux')) {

    $option = get_option('pe-redux');
}

?>

<div class="section cart-empty">

    <div class="pe-wrapper">

        <div class="pe-col-12">

            <?php
            do_action('woocommerce_cart_is_empty'); ?>

            <div class="saren--cart--empty">

                <div class="saren--empty--cart--wrap">

                    <div class="empty--cart--icon">
                        <?php echo do_shortcode(file_get_contents(get_template_directory(). '/assets/img/box_open.svg')) ?>
                    </div>

                    <div class="empty--cart--text">

                        <p><?php echo esc_html('Looks like you have not added anything to you cart. Go ahead and explore our top products.') ?>
                        </p>

                    </div>


                    <?php if (wc_get_page_id('shop') > 0): ?>
                        <p class="return-to-shop">

                            <?php

                            $href = '';

                            if (isset($option['empty_cart_button_url'])) {
                                $href = esc_url($option['empty_cart_button_url']);
                            } else {

                                $href = esc_url(apply_filters('woocommerce_return_to_shop_redirect', wc_get_page_permalink('shop')));
                            }

                            ?>


                            <a class="button wc-backward<?php echo esc_attr(wc_wp_theme_get_element_class_name('button') ? ' ' . wc_wp_theme_get_element_class_name('button') : ''); ?>"
                                href="<?php echo esc_url($href); ?>">
                                <?php
                                /**
                                 * Filter "Return To Shop" text.
                                 *
                                 * @since 4.6.0
                                 * @param string $default_text Default text.
                                 */

                                if (isset($option['empty_cart_button_text'])) {

                                    echo esc_html($option['empty_cart_button_text']);


                                } else {

                                    echo esc_html(apply_filters('woocommerce_return_to_shop_text', __('Return to shop', 'woocommerce')));

                                }




                                ?>
                            </a>
                        </p>
                    <?php endif; ?>

                </div>

            </div>

        </div>

    </div>

</div>