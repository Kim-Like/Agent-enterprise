<?php
/**
 * Single variation cart button
 *
 * @see https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.0.1
 */

defined('ABSPATH') || exit;

global $product;

$fileUploads = get_post_meta($product->get_id(), '_enable_file_uploads', true);

?>
<div class="woocommerce-variation-add-to-cart variations_button saren--cart--form">
    <?php do_action('woocommerce_before_add_to_cart_button'); ?>

    <?php
    do_action('woocommerce_before_add_to_cart_quantity');

    woocommerce_quantity_input(
        array(
            'min_value' => apply_filters('woocommerce_quantity_input_min', $product->get_min_purchase_quantity(), $product),
            'max_value' => apply_filters('woocommerce_quantity_input_max', $product->get_max_purchase_quantity(), $product),
            'input_value' => isset($_POST['quantity']) ? wc_stock_amount(wp_unslash($_POST['quantity'])) : $product->get_min_purchase_quantity(), // WPCS: CSRF ok, input var ok.
        )
    ); ?>

    <div class="saren--quantity--control">
        <span class="quantity--decrease"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960"
                width="1em">
                <path d="M232-444v-72h496v72H232Z" />
            </svg></span>
        <span
            class="current--quantity"><?php echo isset($_POST['quantity']) ? wc_stock_amount(wp_unslash($_POST['quantity'])) : $product->get_min_purchase_quantity(); ?></span>
        <span class="quantity--increase"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960"
                width="1em">
                <path d="M444-444H240v-72h204v-204h72v204h204v72H516v204h-72v-204Z" />
            </svg>
        </span>
    </div>



    <?php do_action('woocommerce_after_add_to_cart_quantity'); ?>

    <button type="submit"
        class="single_add_to_cart_button button alt<?php echo esc_attr(wc_wp_theme_get_element_class_name('button') ? ' ' . wc_wp_theme_get_element_class_name('button') : ''); ?>">

        <?php echo '<span class="selec--opt">' . esc_html($product->add_to_cart_text()) . '</span>'; ?>
        <?php echo '<span class="var--add">' . esc_html($product->single_add_to_cart_text()) . '</span>'; ?>

        <span class="selec--opt">
            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
                <path d="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z" />
            </svg>
        </span>

        <span class="var--add">
            <svg class="cart-plus" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
                <path class="cart-plus" d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
            </svg>
            <svg class="cart-loading" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960"
                width="1em">
                <path
                    d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z" />
            </svg>
            <svg class="cart-done" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
            </svg>
            <span class="card-add-icon">
                <?php
                $svgPath = get_template_directory() . '/assets/img/cart-add.svg';
                $icon = file_get_contents($svgPath);
                echo _e($icon);
                ?>

            </span>
        </span>

    </button>

    <?php do_action('woocommerce_after_add_to_cart_button'); ?>

    <input type="hidden" name="add-to-cart" value="<?php echo absint($product->get_id()); ?>" />
    <input type="hidden" name="product_id" value="<?php echo absint($product->get_id()); ?>" />
    <input type="hidden" name="variation_id" class="variation_id" value="0" />
</div>