<?php
/**
 * The Template for displaying product archives, including the main shop page which is a post type archive
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/archive-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 8.6.0
 */

defined('ABSPATH') || exit;

get_header();


$animTitle = 'false';
$pageHeader = true;
$shopPageTitle = '';
$addToCartStyle = 'add--to--cart--style--wide';
$archiveStyle = 'archive--grid';
$metasPos = 'metas__pos-column';
$metasOrientation = 'metas__orientation-column';
$actionsOrientation = 'actions__orientation-row';
$categoryFilters = false;
$paginationStyle = 'ajax-load-more';
$imageHover = '';


if (class_exists('Redux')) {
    $option = get_option('pe-redux');
    $addToCartStyle = 'add--to--cart--style--' . $option['add_to_cart_style'];
    $archiveStyle = 'archive--' . $option['archive_style'];
    $metasPos = 'metas__pos-' . $option['products_metas_position'];
    $metasOrientation = 'metas__orientation-' . $option['products_metas_orientation'];
    $actionsOrientation = 'actions__orientation-' . $option['actions_orientation'];
    $categoryFilters = $option['category_filters'];
    $paginationStyle = $option['pagination_style'];
    $imageHover = 'image-hover-' . $option['image_hover'];
    $shopPageTitle = $option['show_shop_title'];

    $filterCats = [];

    if ($categoryFilters) {
        foreach ($option['cats_for_filters'] as $cat) {
            $filterCats[] = $cat;
        }
    }
    ;

    $classes = [];
    $classes[] = 'grid--switcher--' . $option['g_switcher_style'];

    $option['has_border'] ? $classes[] = 'products--controls--bordered' : '';
    $option['has_bg'] ? $classes[] = 'controls--has--bg' : '';
    $option['has_rounded'] ? $classes[] = 'products--controls--rounded' : '';

}
;

/**
 * Hook: woocommerce_before_main_content.
 *
 * @hooked woocommerce_output_content_wrapper - 10 (outputs opening divs for the content)
 * @hooked woocommerce_breadcrumb - 20
 * @hooked WC_Structured_Data::generate_website_data() - 30
 */
do_action('woocommerce_before_main_content');

?>

<?php if ($pageHeader != false) { ?>
    <!-- Page Header -->
    <div data-anim="true" class="page-header shop-page-header section">

        <div class="page-header-wrap pe-wrapper">

            <div class="pe-col-12">

                <?php if ($shopPageTitle) { ?>

                    <!-- Page Title -->
                    <div class="page-title" data-anim="<?php echo esc_attr($animTitle); ?>">
                        <?php if (apply_filters('woocommerce_show_page_title', true)): ?>
                            <h1 class="woocommerce-products-header__title page-title text-h1"><?php woocommerce_page_title(); ?>
                            </h1>
                            <?php saren_product_count();
                        endif; ?>
                    </div>
                    <!-- /Page Title -->

                <?php } ?>

            </div>


        </div>

    </div>
    <!-- /Page Header -->

<?php } ?>
<div class="section woo-products-archive pop--behavior--left <?php echo esc_attr(implode(' ', $classes, )) ?>">

    <div class="pe-wrapper">

        <div class="pe-col-12">

            <?php

            if (woocommerce_product_loop()) {

                /**
                 * Hook: woocommerce_before_shop_loop.
                 *
                 * @hooked woocommerce_output_all_notices - 10
                 * @hooked woocommerce_result_count - 20
                 * @hooked woocommerce_catalog_ordering - 30
                 */

                echo '<div class="saren--products-grid-controls">';

                if ($option['additional_filters']) { ?>

                    <div class="saren--product--filters">

                        <div class="pe--product--filters <?php echo 'filters--' . $option['filters_behavior'] ?>">

                            <?php if ($option['filters_behavior'] !== 'always-show') {
                                $pop = 'pe--styled--popup filters--popup';
                                ?>

                                <div class="filters--button pe--pop--button">
                                    <?php
                                    if (!empty($option['filters_button_text'])) {
                                        echo esc_html($option['filters_button_text']);
                                    } else {
                                        echo esc_html('Filter', 'saren');
                                    }
                                    ?>

                                    <svg class="filters--default--icon" xmlns="http://www.w3.org/2000/svg" height="1em"
                                        viewBox="0 -960 960 960" width="1em" fill="var(--mainColor)">
                                        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                    </svg>

                                </div>

                                <span class="pop--overlay"></span>

                                <div class="filters--wrapper <?php echo esc_attr($pop) ?>">

                                    <span class="pop--close">
                                        <?php echo file_get_contents(get_template_directory(). '/assets/img/remove.svg'); ?>
                                    </span>

                                    <?php if (!empty($option['select_additonal_filtersa'])) {

                                        foreach ($option['select_additonal_filtersa'] as $filterItem) {

                                            $filter = $filterItem;
                                            $inputStyle = 'classic--checkbox'; ?>

                                            <div class="filters--item <?php echo 'filters_' . $filter ?>">

                                                <?php if ($filter === 'on-sale') { ?>

                                                    <label for="sale_products" class="classic--checkbox">
                                                        <input class="check--sale" type="checkbox" name="sale_products" id="sale_products"
                                                            value="1" />
                                                        <?php if (!empty($filterItem['filter_label'])) {

                                                            echo '<div class="filter--label">' . $filterItem . '</div>';

                                                        } else {
                                                            _e('On sale products', 'saren');
                                                        } ?>
                                                    </label>

                                                <?php } else if ($filter === 'tag' || $filter === 'brands' || $filter === 'categories') {

                                                    if ($filter === 'tag') {
                                                        $selection = !empty($option['select_tags']) ? $option['select_tags'] : '';
                                                        $tax = 'product_tag';

                                                        echo '<div class="filter--label">' . esc_html("Tags", 'saren') . '</div>';

                                                    } else if ($filter === 'brands') {
                                                        $selection = !empty($option['select_brands']) ? $option['select_brands'] : '';
                                                        $tax = 'brand';

                                                        echo '<div class="filter--label">' . esc_html("Brands", 'saren') . '</div>';
                                                    } else if ($filter === 'categories') {
                                                        $selection = !empty($option['select_side_cats']) ? $option['select_side_cats'] : '';
                                                        $tax = 'product_cat';
                                                        echo '<div class="filter--label">' . esc_html("Categories", 'saren') . '</div>';
                                                    }

                                                    $taxonomy = get_terms(array(
                                                        'taxonomy' => $tax,
                                                        'hide_empty' => false,
                                                        'include' => $selection,
                                                    ));

                                                    if (!empty($taxonomy) && !is_wp_error($taxonomy)) {

                                                        echo '<div class="terms-list">';
                                                        foreach ($taxonomy as $term) {

                                                            echo '<label class="term--list--item ' . $inputStyle . '">' .
                                                                '<input class="" type="checkbox" name="' . esc_html($tax) . 'o" value="' . esc_html($term->term_id) . '" />' . esc_html($term->name) . '</label>';
                                                        }

                                                        echo '</div>';
                                                    }

                                                } else if ($filter === 'price') {
                                                    echo '<div class="filter--label">' . esc_html("Price", 'saren') . '</div>';
                                                    ?>

                                                            <div class="filter-price-range">

                                                                <input type="number" id="min_price" name="min_price"
                                                                    value="<?php echo $option['min_price'] ?>" />
                                                                <input type="number" id="max_price" name="max_price"
                                                                    value="<?php echo $option['max_price'] ?>" />

                                                                <div class="filter--range--labels">

                                                                    <span class="label--price--min"><?php echo esc_html('MIN: ') ?>
                                                                <?php echo get_woocommerce_currency_symbol() ?><span><?php echo $option['min_price'] ?></span></span>
                                                                    <span class="label--price--max"><?php echo esc_html('MAX: ') ?>
                                                                <?php echo get_woocommerce_currency_symbol() ?><span><?php echo $option['max_price'] ?></span></span>

                                                                </div>

                                                                <div class="range-slider">
                                                                    <input type="range" id="range_min" min="<?php echo $option['min_price'] ?>"
                                                                        max="<?php echo $option['max_price'] ?>"
                                                                        value="<?php echo $option['min_price'] ?>" step="1">
                                                                    <input type="range" id="range_max" min="<?php echo $option['min_price'] ?>"
                                                                        max="<?php echo $option['max_price'] ?>"
                                                                        value="<?php echo $option['max_price'] ?>" step="1">
                                                                </div>
                                                            </div>

                                                <?php } else {


                                                    $terms = get_terms(array(
                                                        'taxonomy' => 'pa_' . $filter,
                                                        'hide_empty' => false,
                                                    ));


                                                    if (!empty($terms) && !is_wp_error($terms)) {

                                                        echo '<div class="terms-list">';
                                                        echo '<div class="terms-list-title">';
                                                        echo '<p>' . $filter . '</p>';

                                                        echo '</div><div class="terms--terms">';

                                                        foreach ($terms as $term) {
                                                            if (get_field('term_color', $term)) {
                                                                $color = '<span class="filter-term-color" style="background-color: ' . get_field('term_color', $term) . '"></span>';
                                                            } else {
                                                                $color = '';
                                                            }

                                                            echo '<label class="term--list--item ' . $inputStyle . '">'
                                                                . $color .
                                                                '<input class="" type="checkbox" name="' . 'pa_' . $filter . '" value="' . esc_html($term->slug) . '" /><span class="term--name">' . esc_html($term->name) . '</span>
                                                            </label>';
                                                        }
                                                        echo '</div></div>';

                                                    } else {
                                                        echo '<p>No terms found for this attribute.</p>';
                                                    }
                                                } ?>
                                            </div>
                                        <?php }


                                    }
                                    ?>
                                </div>

                            <?php } ?>

                        </div>

                    </div>

                <?php }

                if ($categoryFilters) { ?>
                    <div class="saren--products--filter--cats pe--product--filters">
                        <?php

                        $categories = get_terms([
                            "taxonomy" => "product_cat",
                            "hide_empty" => true,
                            "include" => $filterCats
                        ]);

                        if (!empty($categories) && !is_wp_error($categories)) {

                            echo '<label class="term--list--item">
        <input checked type="checkbox" name="product_cato" value="all" />
        ' . esc_html__('All', 'saren') . '
    </label>';

                            foreach ($categories as $cat) {
                                echo '<label class="term--list--item">
            <input type="checkbox" name="product_cato" value="' . esc_attr($cat->term_id) . '" />
            ' . esc_html($cat->name) . '
        </label>';
                            }
                        }
                        ?>

                    </div>

                    <?php
                }

                if ($option['grid_switcher']) { ?>

                    <div class="pe--grid--switcher products--grid--switcher">

                        <?php

                        if ($option['g_switcher_style'] === 'switch') {
                            ?>
                            <span class="switch--follower"></span>

                        <?php } ?>

                        <?php foreach ($option['grid_switch_columns'] as $key => $col) {

                            if ($col == $option['shop_grid_columns']) {
                                $act = 'switch--active';
                            } else {
                                $act = '';
                            }

                            $svgPath = get_template_directory() . '/assets/img/grid-col-' . $col . '.svg';
                            $icon = file_get_contents($svgPath);

                            echo '<span data-switch-cols="' . $col . '" class="switch--item ' . $col . '--col ' . $act . '">' . $icon . '</span>';

                        } ?>

                    </div>

                <?php }

                do_action('woocommerce_before_shop_loop');
                ?>

                <?php echo '</div>';

                ?>
                <div
                    class="archive-products-section <?php echo $addToCartStyle . ' ' . $archiveStyle . ' ' . $metasPos . ' ' . $metasOrientation . ' ' . $actionsOrientation . ' ' . $imageHover; ?>">
                    <?php
                    woocommerce_product_loop_start();

                    if (wc_get_loop_prop('total')) {

                        $index = 0;
                        while (have_posts()) {
                            $index++;
                            the_post();

                            /**
                             * Hook: woocommerce_shop_loop.
                             */
                            do_action('woocommerce_shop_loop');

                            global $product_index;
                            $product_index = $index;

                            wc_get_template_part('content', 'product');
                        }

                    }

                    woocommerce_product_loop_end();

                    /**
                     * Hook: woocommerce_after_shop_loop.
                     *
                     * @hooked woocommerce_pagination - 10
                     */
                    do_action('woocommerce_after_shop_loop');

                    ?>

                </div>
            </div>

            <?php

            } else {
                /**
                 * Hook: woocommerce_no_products_found.
                 *
                 * @hooked wc_no_products_found - 10
                 */
                do_action('woocommerce_no_products_found');
            }

            /**
             * Hook: woocommerce_after_main_content.
             *
             * @hooked woocommerce_output_content_wrapper_end - 10 (outputs closing divs for the content)
             */
            do_action('woocommerce_after_main_content'); ?>

        <?php

        get_footer();