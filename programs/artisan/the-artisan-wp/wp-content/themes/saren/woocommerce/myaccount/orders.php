<?php
/**
 * Orders
 *
 * Shows orders on the account page.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/myaccount/orders.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 9.5.0
 */

defined('ABSPATH') || exit;

do_action('woocommerce_before_account_orders', $has_orders); ?>

<?php if ($has_orders): ?>

    <div class="woo--oders--table--title">
        <p><?php echo esc_html('Your Orders', 'woocommerce') ?></p>
    </div>

    <div class="saren--account--orders">

        <?php
        foreach ($customer_orders->orders as $customer_order) {
            $order = wc_get_order($customer_order); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
            $item_count = $order->get_item_count() - $order->get_item_count_refunded();
            ?>

            <div class="saren--acc--order order--status--<?php echo esc_attr($order->get_status()); ?> ">

                <div class="saren--acc--order--top">

                    <?php foreach (wc_get_account_orders_columns() as $column_id => $column_name):
                        $is_order_number = 'order-number' === $column_id;

                        ?>
                        <?php if ($is_order_number): ?>
                            <div class="woocommerce-orders-table__cell woocommerce-orders-table__cell-<?php echo esc_attr($column_id); ?>"
                                data-title="<?php echo esc_attr($column_name); ?>" scope="row">
                            <?php else: ?>
                                <div class="woocommerce-orders-table__cell woocommerce-orders-table__cell-<?php echo esc_attr($column_id); ?>"
                                    data-title="<?php echo esc_attr($column_name); ?>">
                                <?php endif; ?>

                                <?php if (has_action('woocommerce_my_account_my_orders_column_' . $column_id)): ?>
                                    <?php do_action('woocommerce_my_account_my_orders_column_' . $column_id, $order); ?>

                                <?php elseif ($is_order_number): ?>
                                    <?php /* translators: %s: the order number, usually accompanied by a leading # */ ?>
                                    <a href="<?php echo esc_url($order->get_view_order_url()); ?>"
                                        aria-label="<?php echo esc_attr(sprintf(__('View order number %s', 'woocommerce'), $order->get_order_number())); ?>">
                                        <?php echo esc_html(_x('#', 'hash before order number', 'woocommerce') . $order->get_order_number()); ?>
                                    </a>

                                <?php elseif ('order-date' === $column_id): ?>
                                    <time
                                        datetime="<?php echo esc_attr($order->get_date_created()->date('c')); ?>"><?php echo esc_html(wc_format_datetime($order->get_date_created())); ?></time>

                                <?php elseif ('order-status' === $column_id): ?>
                                    <?php echo '<span>' . esc_html(wc_get_order_status_name($order->get_status())) . '</span>'; ?>
                                <?php endif; ?>

                                <?php if ($is_order_number): ?>
                                </div>
                            <?php else: ?>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </div>

                <div class="saren--acc--order--bottom">
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
                    <?php foreach (wc_get_account_orders_columns() as $column_id => $column_name):
                        $is_order_number = 'order-number' === $column_id;
                        ?>
                        <?php if ($is_order_number): ?>
                            <div class="woocommerce-orders-table__cell woocommerce-orders-table__cell-<?php echo esc_attr($column_id); ?>"
                                data-title="<?php echo esc_attr($column_name); ?>" scope="row">
                            <?php else: ?>
                                <div class="woocommerce-orders-table__cell woocommerce-orders-table__cell-<?php echo esc_attr($column_id); ?>"
                                    data-title="<?php echo esc_attr($column_name); ?>">
                                <?php endif; ?>

                                <?php if (has_action('woocommerce_my_account_my_orders_column_' . $column_id)): ?>
                                    <?php do_action('woocommerce_my_account_my_orders_column_' . $column_id, $order); ?>

                                <?php elseif ('order-total' === $column_id): ?>
                                    <?php
                                    /* translators: 1: formatted order total 2: total order items */
                                    echo wp_kses_post(sprintf(_n('%1$s for %2$s item', '%1$s for %2$s items', $item_count, 'woocommerce'), $order->get_formatted_order_total(), $item_count));
                                    ?>

                                <?php elseif ('order-actions' === $column_id): ?>
                                    <?php
                                    $actions = wc_get_account_orders_actions($order);

                                    if (!empty($actions)) {
                                        foreach ($actions as $key => $action) { // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
                                            /* translators: %s: order number */
                                            echo '<a href="' . esc_url($action['url']) . '" class="woocommerce-button' . esc_attr($wp_button_class) . ' button ' . sanitize_html_class($key) . '" aria-label="' . esc_attr(sprintf(__('View order number %s', 'woocommerce'), $order->get_order_number())) . '">' . esc_html($action['name']) . '</a>';
                                        }
                                    }
                                    ?>
                                <?php endif; ?>

                                <?php if ($is_order_number): ?>
                                </div>
                            <?php else: ?>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; ?>

                </div>



            </div>

        <?php }
        ?>
    </div>

    <?php do_action('woocommerce_before_account_orders_pagination'); ?>

    <?php if (1 < $customer_orders->max_num_pages): ?>
        <div class="woocommerce-pagination woocommerce-pagination--without-numbers woocommerce-Pagination">
            <?php if (1 !== $current_page): ?>
                <a class="woocommerce-button woocommerce-button--previous woocommerce-Button woocommerce-Button--previous button<?php echo esc_attr($wp_button_class); ?>"
                    href="<?php echo esc_url(wc_get_endpoint_url('orders', $current_page - 1)); ?>"><?php esc_html_e('Previous', 'woocommerce'); ?></a>
            <?php endif; ?>

            <?php if (intval($customer_orders->max_num_pages) !== $current_page): ?>
                <a class="woocommerce-button woocommerce-button--next woocommerce-Button woocommerce-Button--next button<?php echo esc_attr($wp_button_class); ?>"
                    href="<?php echo esc_url(wc_get_endpoint_url('orders', $current_page + 1)); ?>"><?php esc_html_e('Next', 'woocommerce'); ?></a>
            <?php endif; ?>
        </div>
    <?php endif; ?>

<?php else: ?>

    <?php wc_print_notice(esc_html__('No order has been made yet.', 'woocommerce') . ' <a class="woocommerce-Button wc-forward button' . esc_attr($wp_button_class) . '" href="' . esc_url(apply_filters('woocommerce_return_to_shop_redirect', wc_get_page_permalink('shop'))) . '">' . esc_html__('Browse products', 'woocommerce') . '</a>', 'notice'); // phpcs:ignore WooCommerce.Commenting.CommentHooks.MissingHookComment ?>

<?php endif; ?>

<?php do_action('woocommerce_after_account_orders', $has_orders); ?>