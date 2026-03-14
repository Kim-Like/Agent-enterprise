<?php
/**
 * The template for displaying product content within loops
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 9.4.0
 */

defined('ABSPATH') || exit;

global $product;
global $product_index;
// Ensure visibility.
if (empty($product) || !$product->is_visible()) {
    return;
}

if (class_exists("Redux")) {
    $option = get_option('pe-redux');
} else {
    $option = [];
}


$highlighted = [];
if ($option['highlight_products'] == true) {

    if ($option['highlight_by'] === 'product') {

        foreach ($option['highlighted_products'] as $highlight) {
            $highlighted[] = $highlight;
        }

    } else if ($option['highlight_by'] === 'key') {

        $keys = explode(",", $option['highlight_keys']);

        foreach ($keys as $highlitedKey) {
            $highlighted[] = $highlitedKey;
        }
    }

}


$isHighlighted = in_array(get_the_ID(), $highlighted) || in_array($product_index, $highlighted) ? 'product--highlighted' : '';

$masonry = '';

if ($option['archive_style'] === 'masonry') {
    $masonry = 'product--masonry--item';
}

$classes = 'saren--single--product inner--anim carousel--item ' . $option['products_style'] . ' ' . $masonry . ' ' . $isHighlighted;

?>

<!-- Single Product -->
<div <?php wc_product_class($classes, $product); ?> data-index="<?php echo esc_attr($product_index) ?>"
    data-product-id="<?php echo get_the_ID(); ?>">
    <?php if (isset($option['show_add_to_cart']) && $option['show_add_to_cart'] && $product->is_type('variable') && $option['add-to-cart-variables'] !== 'fast') { ?>
        <div class="pop--behavior--center quick-add-to-cart-popup quick_pop_id-<?php echo get_the_ID(); ?>"
            data-product-id="<?php echo get_the_ID(); ?>" style="display: none">
            <span class="pop--overlay"></span>

            <div class="pe--styled--popup">

                <span class="pop--close">

                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
                        <path
                            d="m291-240-51-51 189-189-189-189 51-51 189 189 189-189 51 51-189 189 189 189-51 51-189-189-189 189Z" />
                    </svg>

                </span>
                <div class="saren--popup--cart--product">

                    <div class="saren--popup--cart-product-meta">
                        <div class="saren--popup--cart-product-image">
                            <img class="spcp--img" src="">
                        </div>
                        <div class="saren--popup--cart-product-cont">
                            <h6 class="spcp--price"></h6>
                            <h4 class="spcp--title"></h4>
                            <p class="spcp--desc no-margin"></p>
                            <div class="saren--popup--cart-product-form"></div>

                        </div>
                    </div>
                    

                </div>

            </div>
        </div>
    <?php } ?>

    <div class="saren--product--wrap">
        <?php
        if ($product->is_on_sale()) {
            $regular_price = (float) $product->get_regular_price();
            $sale_price = (float) $product->get_price();
            $discount_percentage = calculate_discount_percentage($regular_price, $sale_price);

            echo '<span class="sale--badge">' . esc_html('SALE', 'saren');
            if ($discount_percentage > 0) {
                echo '<p class="discount-badge">-' . $discount_percentage . '%</p>';
            }
            echo '</span>';


        }
        ?>

        <div class="saren--product--image--wrap">

            <?php if (get_field('product_video') === 'vimeo' || get_field('product_video') === 'youtube' || get_field('product_video') === 'self') {
                $provider = get_field('product_video');
                $video_id = get_field('video_id');
                $self_video = get_field('self_hosted_video');
                ?>

                <div class="saren--product--video">
                    <a href="<?php echo apply_filters('woocommerce_loop_product_link', get_the_permalink(), $product); ?>"
                        data-id="<?php echo get_the_id() ?>">

                        <div class="pe-video pe-<?php echo esc_attr($provider) ?>" data-controls=false data-autoplay=true
                            data-muted=true data-loop=true>

                            <?php if ($provider === 'self') { ?>
                                <video class="p-video" autoplay muted loop playsinline>
                                    <source src="<?php echo esc_url($self_video['url']); ?>">
                                </video>
                            <?php } else { ?>
                                <div class="p-video" data-plyr-provider="<?php echo esc_attr($provider) ?>"
                                    data-plyr-embed-id="<?php echo esc_attr($video_id) ?>"></div>
                            <?php } ?>
                        </div>
                    </a>
                </div>

                <?php if ($option['image_hover'] === 'image') {

                    echo '<div class="product--image--hover"><img src="' . get_the_post_thumbnail_url() . '"></div>';
                } ?>

            <?php } else { ?>

                <div class="saren--product--image product__image__<?php echo get_the_ID() ?>">

                    <a class="product--barba--trigger" data-id="<?php echo get_the_id() ?>"
                        href="<?php echo apply_filters('woocommerce_loop_product_link', get_the_permalink(), $product); ?>">

                        <?php $attachment_ids = $product->get_gallery_image_ids();

                        if ($attachment_ids) { ?>

                            <img class="product-image-front" src="<?php echo get_the_post_thumbnail_url(); ?>">

                        <?php } else { ?>
                            <img src="<?php echo get_the_post_thumbnail_url(); ?>">
                        <?php } ?>
                    </a>

                </div>

                <?php if ($option['product_gallery']) {
                    $attachment_ids = $product->get_gallery_image_ids();

                    if ($attachment_ids) {

                        echo '<div class="product--archive--gallery swiper-container">'; ?>

                        <div class="product--archive--gallery--nav">

                            <div class="pag--prev">
                                <?php $svgPath = get_template_directory() . '/assets/img/chevron_down.svg';
                                $icon = file_get_contents($svgPath);
                                echo $icon;
                                ?>

                            </div>
                            <div class="pag--next">
                                <?php
                                $icon = file_get_contents($svgPath);
                                echo $icon;
                                ?>

                            </div>

                        </div>


                        <?php echo '<div class="swiper-wrapper">';

                        echo '<div class="product--archvive--gallery--image swiper-slide">
                    <a href="' . apply_filters('woocommerce_loop_product_link', get_the_permalink(), $product) . '" class="product--barba--trigger" data-id="' . get_the_id() . '">
                    <img src="' . get_the_post_thumbnail_url() .
                            '"></a></div>';

                        foreach ($attachment_ids as $key => $attachment_id) {

                            echo '<div class="product--archvive--gallery--image swiper-slide">
                        <a href="' . apply_filters('woocommerce_loop_product_link', get_the_permalink(), $product) . '" class="product--barba--trigger" data-id="' . get_the_id() . '">'
                                . wp_get_attachment_image($attachment_id, 'medium') .
                                '</a></div>';

                        }

                        echo '</div>';
                        echo '</div>';

                    }

                } ?>

                <?php if ($option['image_hover'] === 'image') {
                    $attachment_ids = $product->get_gallery_image_ids();
                    if ($attachment_ids) {

                        foreach ($attachment_ids as $key => $attachment_id) {
                            if ($key == 0) {
                                echo '<div class="product--image--hover">' . wp_get_attachment_image($attachment_id, 'full') . '</div>';
                            }
                        }
                    }
                } ?>

            <?php }

            if ($option['add-to-cart-variables'] === 'fast' && $product->is_type('variable')) { ?>
                <div class="saren--fast--add">

                    <?php $attribute = $option['add-to-cart-vars'];

                    if (!empty($attribute)) {

                        $default_attributes = $product->get_default_attributes();

                        ?>
                        <div class="saren--fast--add--vars" data-product-id="<?php echo get_the_ID(); ?>">

                            <?php

                            $vars = wc_get_attribute($attribute);
                            $variations = $product->get_available_variations();

                            if ($vars) {

                                $taxonomy = esc_attr($vars->slug);
                                $id = $vars->id;
                                $display_type = get_option("wc_attribute_display_type-$id", 'default');
                                $terms = wc_get_product_terms($product->get_id(), $taxonomy, array('fields' => 'all'));
                                $matched_variations = [];

                                if (!empty($default_attributes)) {
                                    foreach ($default_attributes as $key => $attr) {
                                        if ($key !== $taxonomy) {
                                            $matched_variations = array_filter($variations, function ($variation) use ($key, $attr) {
                                                return isset($variation['attributes']['attribute_' . $key]) && $variation['attributes']['attribute_' . $key] === $attr;
                                            });
                                        }
                                    }
                                }



                                if (!empty($terms)) {

                                    echo '<span class="fast--var--name">' . esc_html($vars->name) . '</span>';
                                    ?>
                                    <div class="single--product--vars attr--dt--<?php echo $display_type ?>">
                                        <?php
                                        foreach ($terms as $term) {

                                            $variation_id = null;
                                            $in_stock = true;

                                            foreach ($variations as $variation) {
                                                if (isset($variation['attributes']["attribute_$taxonomy"]) & $variation['attributes']["attribute_$taxonomy"] == $term->slug) {
                                                    $variation_id = $variation['variation_id'];
                                                    $in_stock = $variation['is_in_stock'];
                                                    break;
                                                }
                                            }

                                            if (!empty($default_attributes) && $in_stock) {
                                                $slug = $term->slug;

                                                $match = array_filter($matched_variations, function ($matcho) use ($taxonomy, $slug) {
                                                    return isset($matcho['attributes']['attribute_' . $taxonomy]) && $matcho['attributes']['attribute_' . $taxonomy] === $slug;
                                                });

                                                $variation_ids = array_column($match, 'variation_id');
                                                $variation_id = $variation_ids[0];

                                            }
                                            ;

                                            if (get_field('term_color', $term)) {
                                                echo '<span data-stock="' . $in_stock . '" style="--bg: ' . get_field('term_color', $term) . '" data-variation-id="' . esc_attr($variation_id) . '">' . esc_html($term->name) . '</span>';
                                            } else {
                                                echo '<span data-stock="' . $in_stock . '" data-variation-id="' . esc_attr($variation_id) . '">' . esc_html($term->name) . '
                                        <svg class="cart-loading" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960"
                                        width="1em">
                                        <path
                                            d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z" />
                                    </svg>
                                    <svg class="cart-done" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
                                        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                                    </svg>
                                        </span>';
                                            }
                                        } ?>
                                    </div>
                                <?php }
                            }
                            ?>
                        </div>
                        <?php
                    } ?>

                </div>
            <?php }
            ?>

            <?php if ($option['actions_visibility'] === 'hover') { ?>
                <div class="saren--product--actions" data-barba-prevent="all">

                    <?php if ($option['show_wishlist']) { ?>
                        <div class="saren--product-quick-action">
                            <?php
                            if ($option['wishlist_type'] === 'yith') {
                                if (class_exists('YITH_WCWL') && $settings['favorite'] === 'show') {
                                    echo do_shortcode('[yith_wcwl_add_to_wishlist]');
                                }
                            } else {
                                peWishlistButton($product->get_id(), $option);
                            }
                            ?>
                        </div>

                    <?php } ?>

                    <?php if ($option['show_compare']) { ?>

                        <div class="saren--product-quick-action">
                            <?php
                            $svgPath = get_template_directory() . '/assets/img/compare.svg';
                            $icon = file_get_contents($svgPath);

                            echo '<span class="pe--compare--wrap" data-barba-prevent="all">
                              <span class="compare--svg">' . _e($icon) . '</span>
                              '
                                . do_shortcode('[yith_compare_button]') . '
                              </span>';
                            ?>
                        </div>

                    <?php } ?>

                    <?php
                    if ($option['show_add_to_cart']) { ?>
                        <?php if ($product->is_type('variable') && $option['add-to-cart-variables'] !== 'fast') { ?>
                            <div class="saren--product-quick-action">
                                <button class="quick-add-to-cart-btn" data-product-id="<?php echo esc_attr($product->get_id()); ?>">

                                    <?php
                                    if ($option['add_to_cart_style'] === 'wide') {

                                        echo '<span class="quick--text">' . esc_html('Quick Shop', 'saren') . '</span>';

                                    } ?>
                                    <span class="card-add-icon">
                                        <?php
                                        $svgPath = get_template_directory() . '/assets/img/cart-add.svg';
                                        $icon = file_get_contents($svgPath);
                                        echo $icon; ?>
                                    </span>

                                    <svg class="cart-loading" xmlns="http://www.w3.org/2000/svg" height="1em"
                                        viewBox="0 -960 960 960" width="1em">
                                        <path
                                            d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z" />
                                    </svg>
                                </button>
                            </div>
                        <?php } else { ?>
                            <div class="saren--single--atc">
                                <?php if ($option['show_add_to_cart']) {
                                    if ($product->is_type('simple')) {
                                        woocommerce_simple_add_to_cart();
                                    } elseif ($product->is_type('grouped')) {
                                        woocommerce_grouped_add_to_cart();
                                    } elseif ($product->is_type('external')) {
                                        woocommerce_external_add_to_cart();
                                    }
                                } ?>

                            </div>
                        <?php }
                    } ?>


                    <?php if ($option['view_button']) { ?>

                        <div class="saren--product-quick-action">
                            <?php
                            $svgPath = get_template_directory() . '/assets/img/arrow_forward.svg';
                            $icon = file_get_contents($svgPath);
                            echo '<a href="' . apply_filters('woocommerce_loop_product_link', get_the_permalink(), $product) . '" class="pe--view--button product--barba--trigger" data-id="' . get_the_id() . '">
<span>' . $icon . '</span>
</a>';
                            ?>
                        </div>

                    <?php } ?>

                </div>
            <?php } ?>

        </div>

        <!-- Product Meta -->
        <div class="saren--product--meta">
            <div class="saren--product--main">
                <?php echo '<div class="product-name ' . esc_attr(apply_filters('woocommerce_product_loop_title_classes', 'woocommerce-loop-product__title')) . '">' . get_the_title() . '</div>'; // Product title 
                
                if ($option['show_price']) {

                    if ($price_html = $product->get_price_html()) { ?>
                        <div class="product-price"><?php echo do_shortcode($price_html); ?></div><!-- Product Price -->
                    <?php }

                }

                if ($option['short__desc']) {
                    echo '<div class="product-short-desc">' . $product->get_short_description() . '</div>';
                } ?>
            </div>


            <?php if ($option['actions_visibility'] === 'visible') {
                ?>

                <div class="saren--product--actions" data-barba-prevent="all">

                    <?php if ($option['show_wishlist']) { ?>
                        <div class="saren--product-quick-action act--wishlist">
                            <?php
                            if ($option['wishlist_type'] === 'yith') {
                                if (class_exists('YITH_WCWL') && $settings['favorite'] === 'show') {
                                    echo do_shortcode('[yith_wcwl_add_to_wishlist]');
                                }
                            } else {
                                peWishlistButton($product->get_id(), $option);
                            }
                            ?>
                        </div>

                    <?php } ?>

                    <?php if ($option['show_compare']) { ?>

                        <div class="saren--product-quick-action">
                            <?php
                            $svgPath = get_template_directory() . '/assets/img/compare.svg';
                            $icon = file_get_contents($svgPath);

                            echo '<span class="pe--compare--wrap" data-barba-prevent="all">
              <span class="compare--svg">' . _e($icon) . '</span>
              '
                                . do_shortcode('[yith_compare_button]') . '
              </span>';
                            ?>
                        </div>

                    <?php } ?>

                    <?php
                    if ($option['show_add_to_cart']) { ?>
                        <?php if ($product->is_type('variable') && $option['add-to-cart-variables'] !== 'fast') { ?>
                            <div class="saren--product-quick-action">
                                <button class="quick-add-to-cart-btn" data-product-id="<?php echo esc_attr($product->get_id()); ?>">

                                    <?php
                                    if ($option['add_to_cart_style'] === 'wide') {

                                        echo '<span class="quick--text">' . esc_html('Quick Shop', 'saren') . '</span>';

                                    } ?>
                                    <span class="card-add-icon">
                                        <?php
                                        $svgPath = get_template_directory() . '/assets/img/cart-add.svg';
                                        $icon = file_get_contents($svgPath);
                                        echo $icon; ?>
                                    </span>

                                    <svg class="cart-loading" xmlns="http://www.w3.org/2000/svg" height="1em"
                                        viewBox="0 -960 960 960" width="1em">
                                        <path
                                            d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z" />
                                    </svg>
                                </button>
                            </div>
                        <?php } else { ?>
                            <div class="saren--single--atc">
                                <?php if ($option['show_add_to_cart']) {
                                    if ($product->is_type('simple')) {
                                        woocommerce_simple_add_to_cart();
                                    } elseif ($product->is_type('grouped')) {
                                        woocommerce_grouped_add_to_cart();
                                    } elseif ($product->is_type('external')) {
                                        woocommerce_external_add_to_cart();
                                    }
                                } ?>

                            </div>
                        <?php }
                    } ?>


                    <?php if ($option['view_button']) { ?>

                        <div class="saren--product-quick-action">
                            <?php
                            $svgPath = get_template_directory() . '/assets/img/arrow_forward.svg';
                            $icon = file_get_contents($svgPath);
                            echo '<a href="' . apply_filters('woocommerce_loop_product_link', get_the_permalink(), $product) . '" class="pe--view--button product--barba--trigger" data-id="' . get_the_id() . '">
<span>' . $icon . '</span>
</a>';
                            ?>
                        </div>

                    <?php } ?>

                </div><?php
            }
            ?>

            <div class="saren--product--extras">

                <?php if ($option['show_categories'] && !empty($option['single_categories_to_show'])) { ?>

                    <div class="saren--product--cats">

                        <?php

                        $selectedCats = $option['single_categories_to_show'];
                        $categories = wp_get_post_terms($product->get_id(), 'product_cat');

                        foreach ($categories as $category) {
                            if (!empty($selectedCats)) {
                                if (in_array($category->term_id, $selectedCats)) {
                                    echo '<span>' . $category->name . '</span>';
                                }
                            } else {
                                echo '<span>' . $category->name . '</span>';
                            }

                        } ?>

                    </div>

                <?php } ?>

                <?php if ($option['show_tags'] && !empty($option['single_tags_to_show'])) { ?>

                    <div class="saren--product--tags">

                        <?php

                        $selectedTags = $option['single_tags_to_show'];
                        $tags = wp_get_post_terms($product->get_id(), 'product_tag');

                        foreach ($tags as $tag) {
                            if (!empty($selectedTags)) {
                                if (in_array($tag->term_id, $selectedTags)) {
                                    echo '<span>' . $tag->name . '</span>';
                                }
                            } else {
                                echo '<span>' . $tag->name . '</span>';
                            }
                        } ?>

                    </div>

                <?php } ?>

                <?php if (isset($option['show_variations']) && $option['show_variations'] && !empty($option['single_attributes_to_show'])) {
                    $attributes = $option['single_attributes_to_show'];
                    $swatches = '';

                    if (!empty($attributes)) {
                        if ($option['variations_swatches']) {
                            $variations = $product->get_available_variations();
                            $swatches = 'has--swatches';
                        }
                        ?>
                        <div class="saren--single--product--attributes <?php echo esc_attr($swatches) ?>">
                            <?php
                            foreach ($attributes as $attribute) {
                                $vars = wc_get_attribute($attribute);

                                if ($vars) {
                                    $taxonomy = esc_attr($vars->slug);
                                    $id = $vars->id;
                                    $display_type = get_option("wc_attribute_display_type-$id", 'default');
                                    $terms = wc_get_product_terms($product->get_id(), $taxonomy, array('fields' => 'all'));

                                    if (!empty($terms)) { ?>
                                        <div class="single--product--attributes attr--dt--<?php echo $display_type ?>">
                                            <?php
                                            foreach ($terms as $term) {

                                                $variation_id = null;

                                                if ($option['variations_swatches']) {

                                                    foreach ($variations as $variation) {
                                                        if (
                                                            isset($variation['attributes']["attribute_$taxonomy"]) &&
                                                            $variation['attributes']["attribute_$taxonomy"] == $term->slug
                                                        ) {
                                                            $variation_id = $variation['variation_id'];
                                                            break;
                                                        }
                                                    }
                                                }

                                                $linked = '';
                                                if (get_post_meta($variation_id, '_linked_variation_checkbox', true)) {
                                                    $linked_product_id = get_post_meta($variation_id, '_linked_variation_product', true);
                                                    $linked = 'data-linked-id="' . $linked_product_id . '"';
                                                }

                                                if (get_field('term_color', $term)) {

                                                    echo '<span ' . $linked . ' style="--bg: ' . get_field('term_color', $term) . '" data-variation-id="' . esc_attr($variation_id) . '">' . esc_html($term->name) . '</span>';
                                                } else {
                                                    echo '<span ' . $linked . ' data-variation-id="' . esc_attr($variation_id) . '">' . esc_html($term->name) . '</span>';
                                                }
                                            } ?>
                                        </div>
                                    <?php }
                                }
                            } ?>
                        </div>
                        <?php
                    }
                } ?>


            </div>


        </div>
        <!--/ Product Meta -->

    </div>
</div>

<!--/ Single Product -->