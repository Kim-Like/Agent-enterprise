<?php
/**
 * My Account Dashboard
 *
 * Shows the first intro screen on the account dashboard.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/myaccount/dashboard.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 4.4.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

$current_user_id = get_current_user_id();

$allowed_html = array(
    'a' => array(
        'href' => array(),
    ),
);
?>

<div class="saren--account--dashboard">

    <div class="saren--account--dashboard--nav">
        <?php do_action('woocommerce_account_navigation'); ?>
    </div>

    <div class="saren--account--dashboard--head">

        <div class="user--curent--orders">
            <?php
            $active_orders = wc_get_orders(array(
                'customer' => $current_user_id,
                'status' => array('processing', 'on-hold'),
                'return' => 'ids'
            ));

            $active_order_count = count($active_orders);

            echo '<span class="user--num">' . esc_html($active_order_count) . '</span>';
            echo '<span>' . esc_html('Active Orders', 'saren') . '</span>';

            ?>

        </div>

        <div class="user--past--orders">
            <?php
            $completed_orders = wc_get_orders(array(
                'customer' => $current_user_id,
                'status' => 'completed',
                'return' => 'ids'
            ));
            $completed_order_count = count($completed_orders);

            echo '<span class="user--num">' . esc_html($completed_order_count) . '</span>';
            echo '<span>' . esc_html('Orders Completed', 'saren') . '</span>'
                ?>

        </div>

        <?php if (class_exists('YITH_WCWL')) {
            $wishlist = YITH_WCWL_Wishlist_Factory::get_default_wishlist($current_user_id);
            if ($wishlist) {
                ?>
                <div class="user--wishlist--items">
                    <?php
                    $wishlist_count = count($wishlist->get_items());
                    echo '<span class="user--num">' . esc_html($wishlist_count) . '</span>';
                    echo '<span>' . esc_html('Products in Wishlist', 'saren') . '</span>';
                    ?>
                </div>
            <?php }
        } ?>

        <div class="user--downloadable--items">
            <?php
            $orders = wc_get_orders(array(
                'customer' => $current_user_id,
                'status' => array('completed', 'processing'),
                'return' => 'ids'
            ));

            $downloadable_count = 0;

            foreach ($orders as $order_id) {
                $order = wc_get_order($order_id);
                foreach ($order->get_items() as $item) {
                    $product = $item->get_product();
                    if ($product && $product->is_downloadable()) {
                        $downloadable_count++;
                    }
                }
            }

            echo '<span class="user--num">' . esc_html($downloadable_count) . '</span>';
            echo '<span>' . esc_html('Downloadable Items', 'saren') . '</span>';
            ?>

        </div>

    </div>

    <div class="saren--account--dashboard--foot">

        <div class="user--latest--orders">

            <?php
            $orders = wc_get_orders(array(
                'customer' => $current_user_id,
                'limit' => 3,
                'orderby' => 'date',
                'order' => 'DESC',
                'status' => array('processing', 'completed', 'refunded', 'cancelled', 'on-hold', 'pending'),
            ));

            if (!empty($orders)) {
                echo '<p class="p-large">' . esc_html('Your Latest Orders', 'saren') . '<a href="' . esc_url(wc_get_account_endpoint_url('orders')) . '">' . esc_html('View All', 'saren') . '</a></p><ul>';
                foreach ($orders as $order) {

                    $order_id = $order->get_id();
                    $order_date = $order->get_date_created()->date('Y-m-d H:i');
                    $order_total = $order->get_formatted_order_total();
                    $order_status = wc_get_order_status_name($order->get_status()); ?>

                    <li>
                        <a href="<?php echo esc_url($order->get_view_order_url()) ?>">
                            <div class="saren--latest--products--item">
                                <span class="lpi--row"><?php echo '<span>#' . esc_html($order_id) . '</span>
                            <span>' . esc_html($order_date) . '</span>' ?></span>
                                <div class="lpi--row lpi--images">
                                    <?php
                                    foreach ($order->get_items() as $item) {
                                        $product = $item->get_product();
                                        if ($product) {
                                            $thumbnail_url = $product->get_image('thumbnail');
                                            echo "<div>$thumbnail_url</div>";
                                        }
                                    }
                                    ?>
                                </div>
                                <span class="lpi--row"><?php echo _e($order_total) ?></span>
                                <span class="lpi--row"><?php echo esc_html($order_status) ?></span>
                            </div>
                        </a>
                    </li>
                <?php }
                echo "</ul>";
            } else {
                echo "<p>" . esc_html('You did not made any orders yet', 'saren') . "</p>";
            }
            ?>


        </div>

        <div class="user--favorite--item">
            <?php

            if ($orders) {
                $products_count = [];
                foreach ($orders as $order_id) {
                    $order = wc_get_order($order_id);
                    foreach ($order->get_items() as $item) {
                        $product_id = $item->get_product_id();
                        if (isset($products_count[$product_id])) {
                            $products_count[$product_id]++;
                        } else {
                            $products_count[$product_id] = 1;
                        }
                    }
                }
                arsort($products_count);
                $most_purchased_product_id = key($products_count);
                $most_purchased_product = wc_get_product($most_purchased_product_id);

                if ($most_purchased_product) {

                    $product_name = $most_purchased_product->get_name();
                    $product_image = $most_purchased_product->get_image();
                    $product_link = get_permalink($most_purchased_product_id);

                    echo '<p>' . esc_html('Most visited product', 'saren') . '</p>'; ?>

                    <div class="mpi--product">

                        <a href="<?php echo esc_url($product_link) ?>">
                            <?php echo _e($product_image) ?>
                            <?php echo '<span>' . esc_html($product_name) . '</span>' ?>
                        </a>

                    </div>

                    <?php
                }

            }
            ?>

        </div>





    </div>

</div>


<?php
/**
 * My Account dashboard.
 *
 * @since 2.6.0
 */
do_action('woocommerce_account_dashboard');

/**
 * Deprecated woocommerce_before_my_account action.
 *
 * @deprecated 2.6.0
 */
do_action('woocommerce_before_my_account');

/**
 * Deprecated woocommerce_after_my_account action.
 *
 * @deprecated 2.6.0
 */
do_action('woocommerce_after_my_account');

/* Omit closing PHP tag at the end of PHP files to avoid "headers already sent" issues. */
