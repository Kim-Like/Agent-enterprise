<?php
function saren_add_woocommerce_support()
{
    add_theme_support('woocommerce', array(
        'thumbnail_image_width' => 300,
        'single_image_width' => 400,

        'product_grid' => array(
            'default_rows' => 3,
            'min_rows' => 2,
            'max_rows' => 8,
            'default_columns' => 4,
            'min_columns' => 2,
            'max_columns' => 5,
        ),
    ));
}

add_action('after_setup_theme', 'saren_add_woocommerce_support');


function saren_remove_shop_breadcrumbs()
{
    remove_action('woocommerce_before_main_content', 'woocommerce_breadcrumb', 20, 0);

}
add_action('template_redirect', 'saren_remove_shop_breadcrumbs');

add_filter('woocommerce_product_variation_title_include_attributes', '__return_false');


remove_action('woocommerce_before_shop_loop', 'woocommerce_result_count', 20);

function saren_product_count()
{
    if (is_woocommerce_activated()) {
        global $wp_query;

        $total_products = $wp_query->found_posts;

        echo '<span>(' . $total_products . ')</span>';
    }

}

function calculate_discount_percentage($regular_price, $sale_price)
{
    if ($regular_price > 0 && $sale_price > 0 && $regular_price > $sale_price) {
        $discount = round(((($regular_price - $sale_price) / $regular_price) * 100), 1);
        return $discount;
    }
    return 0;
}


if (!function_exists('is_woocommerce_page')) {

    function is_woocommerce_page($page = '', $endpoint = '')
    {

        if (!is_woocommerce_activated()) {
            return false;
        }

        if (!$page) {
            return (is_cart() || is_checkout() || is_account_page() || is_wc_endpoint_url());
        }

        switch ($page) {
            case 'cart':
                return is_cart();
                break;

            case 'checkout':
                return is_checkout();
                break;

            case 'account':
                return is_account_page();
                break;

            case 'endpoint':
                if ($endpoint) {
                    return is_wc_endpoint_url($endpoint);
                }

                return is_wc_endpoint_url();
                break;
        }

        return false;
    }
}


add_action('wp_ajax_woocommerce_ajax_add_to_cart', 'woocommerce_ajax_add_to_cart');
add_action('wp_ajax_nopriv_woocommerce_ajax_add_to_cart', 'woocommerce_ajax_add_to_cart');

function woocommerce_ajax_add_to_cart()
{
    $product_id = apply_filters('woocommerce_add_to_cart_product_id', absint($_POST['product_id']));
    $quantity = empty($_POST['quantity']) ? 1 : wc_stock_amount($_POST['quantity']);
    $variation_id = absint($_POST['variation_id']);
    $passed_validation = apply_filters('woocommerce_add_to_cart_validation', true, $product_id, $quantity);
    $product_status = get_post_status($product_id);


    if ($passed_validation && WC()->cart->add_to_cart($product_id, $quantity, $variation_id) && 'publish' === $product_status) {

        do_action('woocommerce_ajax_added_to_cart', $product_id);

        if ('yes' !== get_option('woocommerce_cart_redirect_after_add')) {
            wc_add_to_cart_message(array($product_id => $quantity), true);
        }


        $fragments = WC_AJAX::get_refreshed_fragments();

        wp_send_json([
            'success' => true,
            'fragments' => $fragments,
            'cart_hash' => WC()->cart->get_cart_hash(),

        ]);

    } else {

        $notices = wc_get_notices();
        wc_clear_notices();

        $data = [
            'error' => true,
            'notices' => $notices,
            'product_url' => apply_filters('woocommerce_cart_redirect_after_error', get_permalink($product_id), $product_id)
        ];

        wp_send_json($data);
    }

    wp_die();
}

function update_notices_ajax_add_to_cart_add_fragments($fragments)
{
    $all_notices = WC()->session->get('wc_notices', array());
    $notice_types = apply_filters('woocommerce_notice_types', array('error', 'success', 'notice'));

    ob_start();

    foreach ($notice_types as $notice_type) {
        if (wc_notice_count($notice_type) > 0) {
            wc_get_template("notices/{$notice_type}.php", array(
                'notices' => array_filter($all_notices[$notice_type]),
            ));
        }
    }
    $fragments['notices_html'] = ob_get_clean();

    wc_clear_notices();

    return $fragments;
}
add_filter('woocommerce_add_to_cart_fragments', 'update_notices_ajax_add_to_cart_add_fragments');


function saren_variation_style()
{
    $id = isset($_GET['edit']) ? absint($_GET['edit']) : 0;
    $value = $id ? get_option("wc_attribute_display_type-$id") : '';
    $show_prices = $id ? get_option("wc_attribute_show_prices-$id") : ''; // Get the checkbox value
    $attr_desc = $id ? get_option("wc_attribute_attribute_desctiption-$id") : ''; // Get the checkbox value

    ?>
    <div id="attr-desc">
        <tr class="form-field">
            <th valign="top" scope="row">
                <label for="display_type"><?php _e('Display Type', 'saren'); ?></label>
            </th>
            <td>
                <select name="display_type" id="display_type">
                    <option <?php echo esc_html($value === 'variation_labels' ? 'selected' : ''); ?> value="variation_labels">
                        <?php echo esc_html('Labels', 'saren') ?>
                    </option>
                    <option <?php echo esc_html($value === 'variation_image_label' ? 'selected' : ''); ?>
                        value="variation_image_label">
                        <?php echo esc_html('Image w/ label', 'saren') ?>
                    </option>
                    <option <?php echo esc_html($value === 'variation_image_only' ? 'selected' : ''); ?>
                        value="variation_image_only">
                        <?php echo esc_html('Image only', 'saren') ?>
                    </option>
                    <option <?php echo esc_html($value === 'variation_color_only' ? 'selected' : ''); ?>
                        value="variation_color_only">
                        <?php echo esc_html('Color only', 'saren') ?>
                    </option>
                    <option <?php echo esc_html($value === 'variation_color_label' ? 'selected' : ''); ?>
                        value="variation_color_label">
                        <?php echo esc_html(' Color w/ label', 'saren') ?>
                    </option>
                </select>
            </td>
        </tr>
        <tr class="form-field show--prices">
            <th valign="top" scope="row">
                <label for="show_prices"><?php _e('Show Prices', 'saren'); ?></label>
            </th>
            <td>
                <input type="checkbox" name="show_prices" id="show_prices" value="1" <?php checked($show_prices, '1'); ?> />
                <label for="show_prices"><?php _e('Check to show prices for this variation', 'saren'); ?></label>
            </td>
        </tr>
        <tr class="form-field attr--description">
            <th valign="top" scope="row">
                <label for="attribute_desctiption"><?php _e('Description', 'saren'); ?></label>
            </th>
            <td>
                <input type="text" name="attribute_desctiption" id="attribute_desctiption"
                    placeholder="<?php echo esc_attr('You can enter attribute description here.', 'saren') ?>"
                    value="<?php echo esc_attr($attr_desc) ?>" />
            </td>
        </tr>
    </div>
    <script>
        jQuery(function ($) {
            $('#attr-desc').appendTo('.form-field:eq(1)');
        });
    </script>
    <?php
}
add_action('woocommerce_after_add_attribute_fields', 'saren_variation_style');
add_action('woocommerce_after_edit_attribute_fields', 'saren_variation_style');

function saren_save_variation_style($id)
{
    if (is_admin() && isset($_POST['display_type'])) {
        $option = "wc_attribute_display_type-$id";
        if ($option) {
            update_option($option, sanitize_text_field($_POST['display_type']));
        }
    }

    if (is_admin() && isset($_POST['show_prices'])) {
        $option = "wc_attribute_show_prices-$id";
        if ($option) {
            update_option($option, '1');
        }
    } else {
        $option = "wc_attribute_show_prices-$id";
        if ($option) {
            update_option($option, '0');
        }
    }

    if (is_admin() && isset($_POST['attribute_desctiption'])) {
        $option2 = "wc_attribute_attribute_desctiption-$id";
        if ($option2) {
            update_option($option2, sanitize_text_field($_POST['attribute_desctiption']));
        }
    } else {
        $option2 = "wc_attribute_attribute_desctiption-$id";
        update_option($option2, ''); // Varsayılan bir değer kaydedebilirsiniz
    }
}
add_action('woocommerce_attribute_added', 'saren_save_variation_style');
add_action('woocommerce_attribute_updated', 'saren_save_variation_style');


function saren_wc_radio_variation_attribute_options($args = array())
{
    $args = wp_parse_args(
        $args,
        array(
            'options' => false,
            'attribute' => false,
            'product' => false,
            'class' => '',
        )
    );

    $options = $args['options'];
    $product = $args['product'];
    $attribute = $args['attribute'];

    if (empty($options) && !empty($product)) {
        $attributes = $product->get_variation_attributes();
        $options = $attributes[$attribute];
    }

    $name = 'attribute_' . sanitize_title($attribute);

    if (!empty($options)) {
        echo '<div class="saren-variation-radio-buttons ' . esc_attr($args['class']) . '">';
        $variations = $product->get_available_variations();

        // echo '<pre>';
        foreach ($options as $option) {

            if ($product && taxonomy_exists($attribute)) {

                $term = get_term_by('slug', $option, $attribute);
                $taxonomy = $term->taxonomy;
                $slug = $term->slug;

                $item = array_filter($variations, function ($item) use ($taxonomy, $slug) {
                    return isset($item['attributes']['attribute_' . $taxonomy]) && $item['attributes']['attribute_' . $taxonomy] === $slug;
                });

                $item = reset($item);

                $term_id = wc_attribute_taxonomy_id_by_name($attribute);
                $showPrices = get_option("wc_attribute_show_prices-$term_id", 0);

                if (!is_wp_error($term) && $term && $term->name) {
                    $label = apply_filters('woocommerce_variation_option_name', $term->name, $term, $attribute, $product);
                } else {
                    $label = $option;
                }
            } else {
                $label = apply_filters('woocommerce_variation_option_name', $option, null, $attribute, $product);
            }

            if (is_array($item) && isset($item['is_in_stock'])) {
                echo '<label class="radio--parent" data-stock="' . esc_attr($item['is_in_stock']) . '">';
            }
            $variation_id = isset($item['variation_id']) ? $item['variation_id'] : null;

            if ($variation_id) {
                $linked_checkbox = get_post_meta($variation_id, '_linked_variation_checkbox', true);
            } else {
                $linked_checkbox = false;
            }

            if ($linked_checkbox) {
                $linked_product_id = get_post_meta($item['variation_id'], '_linked_variation_product', true);
                echo '<a href="' . get_the_permalink($linked_product_id) . '">';
            }


            if ($term) {
                echo '<span class="attr--color" style="background-color: ' . get_field('term_color', $term) . '"></span>';
            }

            if (is_array($item) && isset($item['variation_id'])) {
                $gallery_images = get_post_meta($item['variation_id'], 'variation_gallery_images', true);
                if (!is_array($gallery_images)) {
                    $gallery_images = [];
                }

                $hasGallery = '';

                if ($gallery_images) {
                    $hasGallery = 'has--gallery';
                }
            }

            $image_id = '';
            if ($item && $item['image']['thumb_src'] && $item['image']['url']) {

                $item['image_id'] != get_post_thumbnail_id() ? $image_id = $item['image_id'] : '';

                echo "<div class='attr--thumb'><img src=" . $item['image']['thumb_src'] . "></div>";
            }



            if (is_product() || \Elementor\Plugin::$instance->editor->is_edit_mode()) {

                if (is_array($item) && isset($item['variation_id'], $name, $option)) {
                    echo '<input data-single-var-id="' . esc_attr($item['variation_id']) . '" class="' . esc_attr($hasGallery) . '" data-image="' . esc_attr($image_id) . '" type="radio" name="' . esc_attr($name) . '" value="' . esc_attr($option) . '" />';
                }

                if ($showPrices || !empty($item['variation_description'])) {

                    echo '<div class="attr--meta">';
                    echo '<span class="attr--label">' . esc_html($label) . '</span>';
                    if (!empty($item['variation_description'])) {
                        echo '<div class="attr--desc">' . $item['variation_description'] . '</div>';
                    }
                    if ($showPrices) {
                        echo '<div class="attr--price">' . $item['price_html'] . '</div>';
                    }
                    echo '</div>';

                } else {
                    echo '<span class="attr--label">' . esc_html($label) . '</span>';
                }


            } else {

                echo '<input type="radio" name="' . esc_attr($name) . '" value="' . esc_attr($option) . '" /> ';
                echo '<span class="attr--label">' . esc_html($label) . '</span>';

            }
            if ($linked_checkbox) {
                echo '</a>';
            }

            echo '</label>';
        }
        echo '</div>';
    }
}


add_action('wp', 'hide_payment');
function hide_payment()
{
    remove_action('woocommerce_checkout_order_review', 'woocommerce_checkout_payment', 20);
}

add_filter('woocommerce_checkout_fields', 'saren_checkout_fields');
function saren_checkout_fields($fields)
{

    $fields['billing']['billing_first_name']['label'] = 'First Name';
    $fields['billing']['billing_last_name']['label'] = 'Last Name';



    $option = get_option('pe-redux');
    $checkoutFields = $option['checkout-fields-repeater'];

    if (!empty($checkoutFields)) {

        foreach ($checkoutFields['redux_repeater_data'] as $key => $field) {

            $fields[$checkoutFields['field_form'][$key]][$checkoutFields['field_id'][$key]]['label'] = $checkoutFields['field_label'][$key];
            $fields[$checkoutFields['field_form'][$key]][$checkoutFields['field_id'][$key]]['required'] = $checkoutFields['field_required'][$key];
            $fields[$checkoutFields['field_form'][$key]][$checkoutFields['field_id'][$key]]['priority'] = $checkoutFields['field_priority'][$key];

        }

    } else {
        unset($fields['billing']['billing_email']);
        unset($fields['billing']['billing_phone']);
        unset($fields['shipping']['ship_to_different_address']);
    }


    return $fields;

}


// Hook in
add_filter('woocommerce_default_address_fields', 'saren_override_default_address_fields');

// Our hooked in function - $address_fields is passed via the filter!
function saren_override_default_address_fields($address_fields)
{

    $address_fields['address_1']['placeholder'] = '';
    $address_fields['address_2']['placeholder'] = '';

    return $address_fields;
}

add_filter('woocommerce_shipping_instance_form_fields_flat_rate', 'saren__woocommerce_shipping_instance_form_fields_id_filter');
add_filter('woocommerce_shipping_instance_form_fields_free_shipping', 'saren__woocommerce_shipping_instance_form_fields_id_filter');
add_filter('woocommerce_shipping_instance_form_fields_local_pickup', 'saren__woocommerce_shipping_instance_form_fields_id_filter');

function saren__woocommerce_shipping_instance_form_fields_id_filter($settings)
{


    $settings['short_description'] = array(
        'title' => __('Short Description', 'saren'),
        'type' => 'textarea',
        'description' => __('Enter a short description for this shipping method.', 'saren'),
        'default' => '',
        'desc_tip' => true,
    );

    return $settings;
}

function saren_add_description_to_shipping_label($label, $method)
{
    $shipping_zones = WC_Shipping_Zones::get_zones();
    foreach ($shipping_zones as $zone) {
        foreach ($zone['shipping_methods'] as $instance_id => $shipping_method) {
            if ($method->get_method_id() === $shipping_method->id && $method->get_instance_id() === (int) $instance_id) {
                $short_description = $shipping_method->get_option('short_description');
                if ($short_description) {
                    $label .= '<p class="shipping-method-description">' . esc_html($short_description) . '</p>';
                }
            }
        }
    }
    return $label;
}
add_filter('woocommerce_cart_shipping_method_full_label', 'saren_add_description_to_shipping_label', 10, 2);


function saren_enqueue_woocommerce_cart_fragments()
{
    if (class_exists('WooCommerce')) {
        wp_enqueue_script('wc-cart-fragments');
    }
}
add_action('wp_enqueue_scripts', 'saren_enqueue_woocommerce_cart_fragments');

remove_action('woocommerce_widget_shopping_cart_buttons', 'woocommerce_widget_shopping_cart_button_view_cart', 10);
remove_action('woocommerce_widget_shopping_cart_buttons', 'woocommerce_widget_shopping_cart_proceed_to_checkout', 20);

function saren_mini_cart_buttons()
{
    ?>
    <a href="<?php echo wc_get_cart_url(); ?>" data-barba-prevent="all" class="button saren--woo--button saren-view-cart">
        <?php echo esc_html_e('VIEW CART', 'saren'); ?>
        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
            <path d="m243-240-51-51 405-405H240v-72h480v480h-72v-357L243-240Z" />
        </svg>
    </a>
    <a href="<?php echo wc_get_checkout_url(); ?>" data-barba-prevent="all"
        class="button saren--woo--button saren-checkout">
        <?php echo esc_html_e('CHECKOUT', 'saren'); ?>
        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
            <path d="m243-240-51-51 405-405H240v-72h480v480h-72v-357L243-240Z" />
        </svg>
    </a>
    <?php
}
add_action('woocommerce_widget_shopping_cart_buttons', 'saren_mini_cart_buttons', 10);

function update_cart_item_quantity()
{
    $cart_item_key = sanitize_text_field($_POST['cart_item_key']);
    $quantity = intval($_POST['quantity']);

    if ($quantity > 0 && isset(WC()->cart->cart_contents[$cart_item_key])) {
        WC()->cart->set_quantity($cart_item_key, $quantity, true);
        WC()->cart->calculate_totals();
    }


    ob_start();
    woocommerce_mini_cart();
    $mini_cart = ob_get_clean();

    $cart_totals = WC()->cart->get_totals();

    wp_send_json_success(array(
        'mini_cart' => $mini_cart,
        'cart_total' => WC()->cart->get_cart_total(),
        'cart_subtotal' => $cart_totals['subtotal'],
    ));
    wp_die();
}
add_action('wp_ajax_update_cart_item_quantity', 'update_cart_item_quantity');
add_action('wp_ajax_nopriv_update_cart_item_quantity', 'update_cart_item_quantity');



add_action('woocommerce_product_options_general_product_data', 'saren_product_controls');
function saren_product_controls()
{


    woocommerce_wp_checkbox(array(
        'id' => '_enable_file_uploads',
        'wrapper_class' => 'show_if_simple show_if_variable',
        'label' => __('Enable File Uploads', 'woocommerce'),
        'description' => __('Customers will be allowed to upload files on product page.', 'woocommerce'),
    ));
}

add_action('woocommerce_process_product_meta', 'ssave_saren_product_controls');

function ssave_saren_product_controls($post_id)
{
    $enable_file_upload = isset($_POST['_enable_file_uploads']) ? 'yes' : 'no';
    update_post_meta($post_id, '_enable_file_uploads', $enable_file_upload);
}

add_filter('woocommerce_checkout_redirect_empty_cart', '__return_false');
add_filter('woocommerce_checkout_update_order_review_expired', '__return_false');



function woocommerce_ajax_search()
{
    $search_query = sanitize_text_field($_POST['search_query']);
    $count = $_POST['count'];
    $offset = isset($_POST['offset']) ? $_POST['offset'] : 0;

    $args = array(
        'post_type' => 'product',
        'posts_per_page' => $count,
        's' => $search_query,
        'offset' => $offset * $count
    );

    $search_results = new WP_Query($args);
    $count = $search_results->found_posts;

    if ($search_results->have_posts()) {
        echo '<div class="saren--ajax--search--result" data-total=' . esc_attr($count) . '>';
        while ($search_results->have_posts()):
            $search_results->the_post();
            global $product; ?>

            <div class="saren--search--product">

                <a href="<?php echo get_the_permalink() ?>">

                    <div class="saren--search--product--image">

                        <img class="product-image-front" src="<?php echo get_the_post_thumbnail_url(); ?>">

                    </div>

                    <div class="saren--search--product--meta">

                        <div class="saren--search--product--title">

                            <p><?php echo get_the_title() ?></p>

                        </div>

                        <?php if ($price_html = $product->get_price_html()): ?>

                            <div class="product-price"><?php echo do_shortcode($price_html); ?></div>

                        <?php endif; ?>

                    </div>

                </a>

            </div>

        <?php endwhile;
        echo '</div>';
    } else {
        echo '<ul class="no--results--found"><li>' . esc_html('No results found.', 'saren') . '</li></ul>';
    }

    wp_die();
}
add_action('wp_ajax_woocommerce_ajax_search', 'woocommerce_ajax_search');
add_action('wp_ajax_nopriv_woocommerce_ajax_search', 'woocommerce_ajax_search');

function singleatcs($product)
{ ?>
    <div class="saren--product--actions" data-barba-prevent="all">

        <div class="saren--single--actions">

            <div class="ss--act">
                <?php
                if (class_exists('YITH_WCWL')) {
                    echo do_shortcode('[yith_wcwl_add_to_wishlist]');
                } ?>
            </div>
            <div class="ss--act">
                <?php
                if (class_exists('YITH_Woocompare')) {
                    echo do_shortcode('[yith_compare_button]');
                }
                ?>
            </div>
        </div>



        <div class="saren--single--atc">
            <?php
            if ( $product->is_type('simple') ) {
                
                woocommerce_simple_add_to_cart();
            } elseif ($product->is_type('variable')) {

                woocommerce_variable_add_to_cart();
            } elseif ($product->is_type('grouped')) {

                woocommerce_grouped_add_to_cart();
            } elseif ($product->is_type('external')) {

                woocommerce_external_add_to_cart();
            }
            ?>
        </div>

    </div>

<?php }



function is_customer_address_complete($checkout, $form)
{
    if (!is_user_logged_in()) {
        return false;
    }

    $required_fields = $checkout->get_checkout_fields($form);


    foreach ($required_fields as $key => $field) {
        if (isset($field['required']) && $field['required']) {

            $prefix = $form . "_";

            if (strpos($key, $prefix) === 0) {
                $key = substr($key, strlen($prefix));
            }

            $field_value = WC()->customer->get_shipping()[$key];

            if (empty($field_value)) {
                return false;
            }
        }
    }

    return true;
}


add_action('wp_ajax_load_variable_add_to_cart_form', 'load_variable_add_to_cart_form');
add_action('wp_ajax_nopriv_load_variable_add_to_cart_form', 'load_variable_add_to_cart_form');

function load_variable_add_to_cart_form()
{
    if (!isset($_POST['product_id'])) {
        wp_send_json_error('Invalid product ID.');
    }

    $product_id = intval($_POST['product_id']);
    $product = wc_get_product($product_id);

    if ($product && $product->is_type('variable')) {
        ob_start();

        $template_name = 'single-product/add-to-cart/variable.php';

        $args = array(
            'available_variations' => $product->get_available_variations(),
            'attributes' => $product->get_variation_attributes(),
            'selected_attributes' => $product->get_default_attributes(),
        );

        $template_path = '';

        $default_path = untrailingslashit(get_template_directory() . 'woocommerce/single-product/add-to-cart/variable.php');

        wc_get_template($template_name, $args, $template_path, $default_path);

        $form_html = ob_get_clean();

        $product_data = array(
            'image' => wp_get_attachment_image_src($product->get_image_id(), 'large')[0],
            'title' => $product->get_title(),
            'short_description' => $product->get_short_description(),
            'price' => $product->get_price_html(),
            'form_html' => $form_html,
        );

        wp_send_json_success($product_data);
    } else {
        wp_send_json_error('Product not found or not variable.');
    }
}


function saren_woocommerce_archive_query($query)
{

    if (is_woocommerce_activated()) {
        $taxQuery = [];

        if (!is_admin() && $query->is_main_query() && (is_shop() || is_product_taxonomy())) {

            $option = get_option('pe-redux');

            if (isset($_GET['archiveFilter']) && $_GET['archiveFilter'] == true) {
                $taxQuery = [
                    'relation' => 'AND',
                ];

                if (isset($_GET['product_cato']) && $_GET['product_cato'] !== 'all') {

                    $product_cats = is_array($_GET['product_cato']) ? array_map('intval', $_GET['product_cato']) : [intval($_GET['product_cato'])];

                    $taxQuery[] = [
                        'taxonomy' => 'product_cat',
                        'field' => 'id',
                        'terms' => $product_cats,
                        'operator' => 'AND'
                    ];
                }

                $attributes = wc_get_attribute_taxonomies();

                foreach ($attributes as $key => $attr) {
                    $name = $attr->attribute_name;

                    if (isset($_GET['pa_' . $name])) {
                        $taxQuery[] = [
                            'taxonomy' => 'pa_' . $name,
                            'field' => 'slug',
                            'terms' => $_GET['pa_' . $name],
                            'operator' => 'AND'
                        ];
                    }
                }

                if (isset($_GET['product_tago'])) {
                    $taxQuery[] = [
                        'taxonomy' => 'product_tag',
                        'field' => 'term_id',
                        'terms' => $_GET['product_tago'],
                        'operator' => 'AND'
                    ];
                }

                if (isset($_GET['brando'])) {

                    $taxQuery[] = [
                        'taxonomy' => 'brand',
                        'field' => 'id',
                        'terms' => $_GET['brando'],
                        'operator' => 'AND'
                    ];
                }


            }

            isset($_GET['offset']) ? $offset = $_GET['offset'] : $offset = 0;

            $query->set('posts_per_page', $option['shop_posts_per_page']);
            $query->set('orderby', $option['shop_order_by']);
            $query->set('order', $option['shop_order']);
            $query->set('tax_query', $taxQuery);
            $query->set('offset', $offset * $option['shop_posts_per_page']);
            if (!empty($option['excluded_products'])) {
                $query->set('post__not_in', $option['excluded_products']);
            }

        }
    }
}
add_action('pre_get_posts', 'saren_woocommerce_archive_query');

add_action('wp_ajax_update_cart_item_qty', 'update_cart_item_qty');
add_action('wp_ajax_nopriv_update_cart_item_qty', 'update_cart_item_qty');

function update_cart_item_qty()
{
    if (!isset($_POST['cart_item_key']) || !isset($_POST['qty'])) {
        wp_send_json_error('Invalid data.');
    }

    $cart_item_key = sanitize_text_field($_POST['cart_item_key']);
    $qty = intval($_POST['qty']);

    if ($qty > 0 && WC()->cart->set_quantity($cart_item_key, $qty)) {
        wp_send_json_success();
    } else {
        wp_send_json_error('Unable to update cart.');
    }
}


add_action('after_setup_theme', 'saren_woocommerce_gallery_support');
function saren_woocommerce_gallery_support()
{
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
}


function saren_ajax_add_to_cart_redirect()
{

    $redirect_enabled = get_option('woocommerce_cart_redirect_after_add') === 'yes';

    if ($redirect_enabled) {
        ?>
        <script>
            jQuery(function ($) {
                $(document.body).on('added_to_cart', function (event, fragments, cart_hash) {
                    window.location.href = wc_add_to_cart_params.cart_url;
                });
            });
        </script>
        <?php
    }
}
add_action('wp_footer', 'saren_ajax_add_to_cart_redirect');


add_action('wp_ajax_saren_add_variation_to_cart', 'saren_add_variation_to_cart');
add_action('wp_ajax_nopriv_saren_add_variation_to_cart', 'saren_add_variation_to_cart');

function saren_add_variation_to_cart()
{
    if (!isset($_POST['product_id'], $_POST['variation_id'], $_POST['quantity'])) {
        wp_send_json_error('Not enough data.');
    }

    $product_id = intval($_POST['product_id']);
    $variation_id = intval($_POST['variation_id']);
    $quantity = intval($_POST['quantity']);

    $cart_item_key = WC()->cart->add_to_cart($product_id, $quantity, $variation_id);

    if ($cart_item_key) {
        wp_send_json_success(array('message' => 'Variation succesfully added.', 'cart_item_key' => $cart_item_key));
    } else {
        wp_send_json_error('An error occured');
    }
}


function sarenStickyAddToCart($product)
{
    if (!\Elementor\Plugin::$instance->editor->is_edit_mode()) {
        $stickyAddToCart = get_post_meta($product->get_id(), 'sticky_add_to_cart', false);
    } else {
        $stickyAddToCart = true;
    }

    if ($stickyAddToCart) { ?>

        <div class="saren--sticky--add--to--cart">

            <div class="saren--sticky--atc--wrap">
                <div class="saren--sticky--atc--product">

                    <div class="saren--sticky--atc--image"> <?php
                    echo wp_get_attachment_image(get_post_thumbnail_id(), 'medium_large', false, array(
                        'loading' => 'eager',
                        'fetchpriority' => 'high',
                    ));
                    ?></div>
                    <div class="saren--sticky--atc--meta">

                        <h6><?php echo get_the_title() ?></h6>

                        <?php $original_price = $product->get_regular_price();
                        $sale_price = $product->get_sale_price();

                        if ($sale_price && $original_price > $sale_price) {
                            $discount_percentage = round((($original_price - $sale_price) / $original_price) * 100);
                            $discount_text = '<span class="discount-percentage">-' . $discount_percentage . '%</span>';
                        } else {
                            $discount_text = '';
                        }

                        echo '<p>' . $discount_text . $product->get_price_html() . '</p>'; ?>

                    </div>

                </div>
                <div class="saren--sticky--atc--form">

                    <?php if ($product->is_type('variable')) {
                        $variations = $product->get_available_variations();
                        $attributes = $product->get_variation_attributes();
                    
                    ?>
                    <form class="variations_form cart add--button--style--simple saren--sticky--atc"
                        data-variations='<?php echo json_encode($variations); ?>'>
                        <?php foreach ($attributes as $attribute_name => $options): ?>
                            <div class="pe-select">
                                <label for="<?php echo esc_attr($attribute_name); ?>">
                                    <?php echo wc_attribute_label($attribute_name); ?>
                                </label>
                                <select id="<?php echo 'attribute_' . esc_attr($attribute_name); ?>"
                                    name="<?php echo 'attribute_' . esc_attr($attribute_name); ?>">
                                    <option value="">
                                        <?php echo esc_html('Pick a ', 'saren') . wc_attribute_label($attribute_name) ?>
                                    </option>
                                    <?php
                                    foreach ($options as $option):
                                        $term = get_term_by('slug', $option, $attribute_name);
                                        ?>
                                        <option value="<?php echo esc_attr($option); ?>">
                                            <?php echo esc_html($term ? $term->name : $option); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        <?php endforeach; ?>


                        <input type="hidden" id="variation_id" name="variation_id">
                        <input type="hidden" id="product_id" name="product_id" value="<?php echo $product->get_id() ?>">
                        <input type="hidden" id="quantity" name="quantity" value="1">

                        <div class="saren--cart--form">

                            <button disabled type="submit"
                                class="single_add_to_cart_button button alt<?php echo esc_attr(wc_wp_theme_get_element_class_name('button') ? ' ' . wc_wp_theme_get_element_class_name('button') : ''); ?>">
                                <?php echo '<span class="var--add">' . esc_html($product->single_add_to_cart_text()) . '</span>'; ?>


                                <span class="var--add">
                                    <svg class="cart-plus" xmlns="http://www.w3.org/2000/svg" height="1em"
                                        viewBox="0 -960 960 960" width="1em">
                                        <path class="cart-plus" d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                    </svg>
                                    <svg class="cart-loading" xmlns="http://www.w3.org/2000/svg" height="1em"
                                        viewBox="0 -960 960 960" width="1em">
                                        <path
                                            d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z" />
                                    </svg>
                                    <svg class="cart-done" xmlns="http://www.w3.org/2000/svg" height="1em"
                                        viewBox="0 -960 960 960" width="1em">
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
                        </div>

                    </form>
                    
                    <?php  }  else {  
                        woocommerce_simple_add_to_cart();

                    }
                        ?>


                </div>
            </div>
        </div>
        <?php

    }


}
