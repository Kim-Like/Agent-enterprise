<?php
/**
 * Single Product tabs
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/tabs/tabs.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 9.8.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Filter tabs and allow third parties to add their own.
 *
 * Each tab is an array containing title, callback and priority.
 *
 * @see woocommerce_default_product_tabs()
 */
$product_tabs = apply_filters('woocommerce_product_tabs', array());

if (!empty($product_tabs)): ?>
    <div class="woocommerce-tabs wc-tabs-wrapper">

        <ul class="tabs wc-tabs" role="tablist">
            <?php foreach ($product_tabs as $key => $product_tab): ?>
                <li class="<?php echo esc_attr($key); ?>_tab" id="tab-title-<?php echo esc_attr($key); ?>" role="tab"
                    aria-controls="tab-<?php echo esc_attr($key); ?>">
                    <a href="#tab-<?php echo esc_attr($key); ?>">
                        <?php echo wp_kses_post(apply_filters('woocommerce_product_' . $key . '_tab_title', $product_tab['title'], $key)); ?>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
        <?php foreach ($product_tabs as $key => $product_tab): ?>
            <div class="item-<?php echo esc_attr($key); ?> woocommerce-Tabs-panel woocommerce-Tabs-panel--<?php echo esc_attr($key); ?> panel entry-content wc-tab"
                id="tab-<?php echo esc_attr($key); ?>" role="tabpanel"
                aria-labelledby="tab-title-<?php echo esc_attr($key); ?>">

                <?php if (isset($product_tab['callback'])) {
                    $override_meta = get_post_meta(get_the_ID(), '_wpt_override_' . $key, true);
                    $post = get_page_by_path($key, OBJECT, 'woo_product_tab'); // Custom Post Type 'product_tab' olabilir
        
                    if ($post && isset($override_meta) && $override_meta !== 'yes') {
                        if (is_built_with_elementor($post->ID)) {
                            echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($post->ID);
                        } else {
                            call_user_func($product_tab['callback'], $key, $product_tab);
                        }
                    } else {
                        call_user_func($product_tab['callback'], $key, $product_tab);
                    }
                } ?>
            </div>
        <?php endforeach; ?>

        <?php do_action('woocommerce_product_after_tabs'); ?>

    </div>

    <div class="saren--wc--accordion">

        <ul class="swc--accordion">

            <?php foreach ($product_tabs as $key => $product_tab): ?>
                <li id="tab-title-<?php echo esc_attr($key); ?>" class="swc--accordion--item">
                    <div class="swc--item--title item-<?php echo esc_attr($key); ?>">
                        <?php echo wp_kses_post(apply_filters('woocommerce_product_' . $key . '_tab_title', $product_tab['title'], $key));

                        $svgPath = get_template_directory() . '/assets/img/add.svg';
                        $icon = file_get_contents($svgPath);

                        echo '<span class="swc--toggle">' . $icon . '</span>'
                            ?>
                    </div>

                    <div class="swc--item--content">
                        <?php if (isset($product_tab['callback'])) {
                            $override_meta = get_post_meta(get_the_ID(), '_wpt_override_' . $key, true);
                            $post = get_page_by_path($key, OBJECT, 'woo_product_tab'); // Custom Post Type 'product_tab' olabilir
                
                            if ($post && isset($override_meta) && $override_meta !== 'yes') {
                                if (is_built_with_elementor($post->ID)) {
                                    echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($post->ID);
                                } else {
                                    call_user_func($product_tab['callback'], $key, $product_tab);
                                }
                            } else {
                                call_user_func($product_tab['callback'], $key, $product_tab);
                            }
                        } ?>
                    </div>
                </li>
            <?php endforeach; ?>

        </ul>


    </div>

<?php endif; ?>