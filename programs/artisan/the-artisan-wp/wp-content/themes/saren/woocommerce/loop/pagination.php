<?php
/**
 * Pagination - Show numbered pagination for catalog pages
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/loop/pagination.php.
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

$total = isset($total) ? $total : wc_get_loop_prop('total_pages');
$current = isset($current) ? $current : wc_get_loop_prop('current_page');
$base = isset($base) ? $base : esc_url_raw(str_replace(999999999, '%#%', remove_query_arg('add-to-cart', get_pagenum_link(999999999, false))));
$format = isset($format) ? $format : '';

if ($total <= 1) {
    return;
}

$paginationStyle = 'ajax-load-more';
if (class_exists('Redux')) {

    $option = get_option('pe-redux');
    $paginationStyle = $option['pagination_style'];
}

?>

<?php if ($paginationStyle === 'ajax-load-more') { ?>

    <div class="saren--products--load--more saren--products--pagination">

        <?php echo '<p>' . esc_html('Load More', 'saren'), '</p>' ?>

    </div>
<?php } else if ($paginationStyle === 'infinite-scroll') { ?>

        <div class="saren--products--infinite--scroll saren--products--pagination">

            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em" fill="var(--mainColor)">
                <path
                    d="M479.76-136q-70.79 0-133.45-27.04-62.66-27.04-109.45-73.82-46.78-46.79-73.82-109.45Q136-408.97 136-479.76q0-71.64 27.14-134.23 27.14-62.58 73.65-109.13 46.51-46.55 109.39-73.72Q409.06-824 479.69-824q7.81 0 12.06 4.26 4.25 4.26 4.25 11.28t-4.25 11.74Q487.5-792 480-792q-129.67 0-220.84 90.5Q168-611 168-480.5T259.16-259q91.17 91 220.84 91 131 0 221.5-91.16Q792-350.33 792-480q0-7.54 4.75-11.77 4.75-4.23 11.77-4.23t11.25 4.25q4.23 4.25 4.23 12.06 0 70.63-27.16 133.51-27.17 62.88-73.72 109.39t-109.13 73.65Q551.4-136 479.76-136Z" />
            </svg>


        </div>

<?php } 