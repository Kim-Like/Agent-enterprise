<?php
/**
 * The template for displaying product content in the single-product.php template
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-single-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.6.0
 */

defined('ABSPATH') || exit;


global $product;

$productLayout = 'default';
$shortDesc = true;
$showSku = true;
$showCat = true;
$showTags = true;
$slideNumbers = true;
$slideArrows = true;

$galleryClasses = '';

if (class_exists('Redux')) {
    $option = get_option('pe-redux');
    $templateId = '';

    if (get_field('product_layout') === 'custom') {

        $productLayout = 'template';
        $templateId = get_field('product_template');

    } else if (get_field('product_layout') === 'default') {

        $productLayout = 'default';

    } else if (get_field('product_layout') === 'global') {

        $productLayout = $option['single-product-layout'];

        if ($productLayout !== 'default') {
            $productLayout = 'template';
            $templateId = $option['select-single-product-template'];
        } else {

            $shortDesc = $option['show_short_description'];
            $showSku = $option['show_sku'];
            $showCat = $option['show_product_category'];
            $showTags = $option['show_product_tags'];

            $galleryClasses = $option['product_gallery_type'] . ' ' . $option['image-cols'] . ' ' . $option['image-sizes'];

        }
    }

}

/**
 * Hook: woocommerce_before_single_product.
 *
 * @hooked woocommerce_output_all_notices - 10
 */
do_action('woocommerce_before_single_product');

if (post_password_required()) {
    echo get_the_password_form(); // WPCS: XSS ok.
    return;
}

sarenStickyAddToCart($product);

?>

<div class="product-page">

    <?php
    if ($productLayout === 'template') {

        if (function_exists('icl_object_id')) {
            $$templateId = icl_object_id($templateId, 'elementor_library', true, ICL_LANGUAGE_CODE);
        }

        echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($templateId);
    }


    if (is_built_with_elementor()) {
        the_content();
    }

    ?>


    <?php if ($productLayout === 'default') { ?>

        <div class="pe--product-head pe-wrapper <?php echo esc_attr($galleryClasses) ?>">

            <?php $attachment_ids = $product->get_gallery_image_ids();

            if ($attachment_ids) {

                ?>

                <div class="product-gallery">

                    <div class="product-gallery-wrap">

                        <?php

                        if ($option['image-sizes'] === 'img-masonry') {

                            echo '<div class="grid-sizer"></div><div class="grid-gutter"></div>';
                        }

                        foreach ($attachment_ids as $attachment_id) { ?>

                            <div class="product-gallery-image">

                                <img src="<?php echo esc_url($Original_image_url = wp_get_attachment_url($attachment_id)); ?>">

                            </div>

                        <?php } ?>


                    </div>

                </div>

            <?php } else if (has_post_thumbnail()) { ?>

                    <div class="pe--product-image">
                        <img src="<?php echo esc_attr(get_the_post_thumbnail_url()); ?>">
                    </div>

            <?php } ?>


            <div class="product-info">

                <div class="product--main">

                    <div class="product-rating">

                        <?php

                        $rating_count = $product->get_rating_count();
                        $review_count = $product->get_review_count();
                        $average = $product->get_average_rating();

                        if ($rating_count > 0): ?>

                            <div class="woocommerce-product-rating">
                                <?php echo wc_get_rating_html($average, $rating_count); // WPCS: XSS ok. ?>
                                <?php if (comments_open()): ?>
                                    <?php //phpcs:disable ?>
                                    <p class="woocommerce-review-link" rel="nofollow">
                                        (<?php printf(_n('%s review', '%s reviews', $review_count, 'woocommerce'), '<span class="count">' . esc_html($review_count) . '</span>'); ?>)
                                    </p>
                                    <?php // phpcs:enable ?>
                                <?php endif ?>
                            </div>

                        <?php endif; ?>


                    </div>
                    <div class="product-name">
                        <?php the_title('<h1 class="text-h3 product_title entry-title">', '</h1>'); ?>
                    </div>
                    <div
                        class="product-price text-h5 <?php echo esc_attr(apply_filters('woocommerce_product_price_class', 'price')); ?>">
                        <?php echo do_shortcode($product->get_price_html()); ?>
                    </div>


                </div>

                <div class="product--aside">

                    <?php if ($shortDesc) { ?>

                        <div class="product-description">
                            <?php

                            $short_description = apply_filters('woocommerce_short_description', $post->post_excerpt);

                            if (!$short_description) {
                                return;
                            }
                            echo do_shortcode($short_description);

                            ?>
                        </div>

                    <?php } ?>

                    <div class="product-attributes">

                        <?php do_action('woocommerce_product_meta_start');

                        if ($showSku != false) {

                            if (wc_product_sku_enabled() && ($product->get_sku() || $product->is_type('variable'))): ?>

                                <span class="sku_wrapper"><?php esc_html_e('SKU:', 'woocommerce'); ?> <span
                                        class="sku"><?php echo esc_html(($sku = $product->get_sku()) ? $sku : esc_html__('N/A', 'woocommerce')); ?></span></span>

                            <?php endif;
                        }

                        if ($showCat != false) {

                            echo wc_get_product_category_list($product->get_id(), ', ', '<span class="posted_in">' . _n('Category:', 'Categories:', count($product->get_category_ids()), 'woocommerce') . ' ', '</span>');

                        }

                        if ($showTags != false) {

                            echo wc_get_product_tag_list($product->get_id(), ', ', '<span class="tagged_as">' . _n('Tag:', 'Tags:', count($product->get_tag_ids()), 'woocommerce') . ' ', '</span>');

                        }

                        do_action('woocommerce_product_meta_end'); ?>

                    </div>

                    <div class="product-add-to-cart">
                        <?php do_action('woocommerce_' . $product->get_type() . '_add_to_cart'); ?>

                    </div>
                </div>
            </div>

        </div>

        <div class="pe--product-details pe-wrapper">
            <div class="product-detail-tabs">
                <?php $product_tabs = apply_filters('woocommerce_product_tabs', array());

                if (!empty($product_tabs)): ?>

                    <div class="tab-titles-wrap text-h4">

                        <?php foreach ($product_tabs as $key => $product_tab): ?>

                            <div class="tab-title <?php echo esc_attr($key); ?>" data-tab="<?php echo esc_attr($key); ?>">
                                <?php echo wp_kses_post(apply_filters('woocommerce_product_' . $key . '_tab_title', $product_tab['title'], $key)); ?>
                            </div>



                        <?php endforeach; ?>
                    </div>

                    <div class="tab-contents-wrap">

                        <?php foreach ($product_tabs as $key => $product_tab): ?>

                            <div class="tab-content desc-self woocommerce-Tabs-panel woocommerce-Tabs-panel--<?php echo esc_attr($key); ?> panel entry-content wc-tab <?php echo 'tab_' . esc_attr($key); ?>"
                                id="tab-<?php echo esc_attr($key); ?>" role="tabpanel"
                                aria-labelledby="tab-title-<?php echo esc_attr($key); ?>">
                                <?php
                                if (isset($product_tab['callback'])) {
                                    call_user_func($product_tab['callback'], $key, $product_tab);
                                }
                                ?>
                            </div>
                        <?php endforeach; ?>
                    </div>

                <?php endif; ?>
            </div>
        </div>
    <?php } ?>

</div>

<?php do_action('woocommerce_after_single_product'); ?>