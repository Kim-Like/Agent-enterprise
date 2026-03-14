<?php
/**
 * Theme functions file
 */

/**
 * Enqueue parent theme styles first
 * Replaces previous method using @import
 * <http://codex.wordpress.org/Child_Themes>
 */

add_action( 'wp_enqueue_scripts', 'enqueue_parent_theme_style', 99 );

function enqueue_parent_theme_style() {
	wp_enqueue_style( 'saren-parent-style', get_template_directory_uri().'/style.css' );
}

/**
 * Defer non-critical CSS to improve LCP (render-blocking reduction)
 * Keeps saren/style, saren-child/style, plugins.css blocking for above-the-fold layout.
 * Defers plugin/Elementor/WooCommerce styles that load below fold.
 */
function saren_defer_noncritical_css( $tag, $handle, $href, $media ) {
	// Critical: never defer these (above-the-fold layout)
	$critical = array(
		'saren-parent-style',
		'style',
		'plugins',
		'general-sans-font',
	);
	if ( in_array( $handle, $critical, true ) ) {
		return $tag;
	}
	// Defer by handle
	$defer_handles = array(
		'widget-styles',
		'elementor-frontend',
		'elementor-post-',
		'elementor-widget-spacer',
		'woo-blocks',
		'woocommerce-blocks',
		'woocommerce-layout',
		'woocommerce-smallscreen',
		'woocommerce',
		'material-icons-regular',
		'mailin-front',
		'jquery-selectBox',
		'wc-blocks-style',
		'yith-wcwl-main',
		'yith-wcwl-font-awesome',
		'yith-woocompare-frontend',
		'pe-compare',
		'brands',
		'prettyPhoto',
		'revslider',
		'rs6',
		'elementor-global',
		'fonts',
		'robotoslab',
		'roboto',
		'playfairdisplay',
	);
	foreach ( $defer_handles as $pattern ) {
		if ( strpos( $handle, $pattern ) !== false ) {
			return saren_defer_css_tag( $tag ) . '<noscript>' . $tag . '</noscript>';
		}
	}
	// Defer Elementor post-{id}.css (dynamic handles)
	if ( preg_match( '#/post-\d+\.css#', $href ) ) {
		return saren_defer_css_tag( $tag ) . '<noscript>' . $tag . '</noscript>';
	}
	return $tag;
}
function saren_defer_css_tag( $tag ) {
	return str_replace( array( "media='all'", 'media="all"' ), "media='print' onload=\"this.media='all'\"", $tag );
}
add_filter( 'style_loader_tag', 'saren_defer_noncritical_css', 10, 4 );

// Make shipping phone field required at checkout
add_filter('woocommerce_shipping_fields', 'make_shipping_phone_required', 10, 1);
function make_shipping_phone_required($fields) {
    $fields['shipping_phone']['required'] = true;
    return $fields;
}

// 2 for 1 discount code
add_action('woocommerce_cart_calculate_fees', 'bogo_discount_cheapest_free');
function bogo_discount_cheapest_free() {
    if (is_admin() && !defined('DOING_AJAX')) return;
    
    // Only apply if the specific coupon is used
    if (!WC()->cart->has_discount('member2025')) return;
    
    // Prevent using both coupons at the same time
    if (WC()->cart->has_discount('christmas25')) {
        wc_add_notice('You cannot use both discount codes at the same time. Please remove one coupon.', 'error');
        WC()->cart->remove_coupon('christmas25');
        return;
    }
    
    $cart_items = WC()->cart->get_cart();
    $prices = array();
    
    // Collect prices only from products in "Kaffe" or "Coffee" categories
    foreach ($cart_items as $item) {
        $product = $item['data'];
        $product_id = $item['product_id'];
        
        // Handle variable products
        if ($product->is_type('variation')) {
            $product_id = $product->get_parent_id();
        }
        
        // Check if product belongs to "Kaffe" or "Coffee" category (use lowercase slugs)
        if (has_term(array('kaffe', 'coffee'), 'product_cat', $product_id)) {
            $price_excl_tax = wc_get_price_excluding_tax($product);
            $quantity = $item['quantity'];
            
            for ($i = 0; $i < $quantity; $i++) {
                $prices[] = $price_excl_tax;
            }
        }
    }
    
    // Only apply if there are at least 2 eligible items
    if (count($prices) < 2) return;
    
    // Sort prices ascending (cheapest first)
    sort($prices);
    
    // Calculate how many free items (1 free for every 2 purchased)
    $free_items = floor(count($prices) / 2);
    
    // Sum up the discount (cheapest items become free)
    $total_discount = 0;
    for ($i = 0; $i < $free_items; $i++) {
        $total_discount += $prices[$i];
    }
    
    if ($total_discount > 0) {
        // Add fee as taxable - WooCommerce will add VAT to match the product's tax
        WC()->cart->add_fee('Exclusive (Buy 1 Get 1 Free)', -$total_discount, true);
    }
}

// 25% discount code for Coffee/Kaffe categories
add_action('woocommerce_cart_calculate_fees', 'coffee_25_percent_discount');
function coffee_25_percent_discount() {
    if (is_admin() && !defined('DOING_AJAX')) return;
    
    // Only apply if the specific coupon is used
    if (!WC()->cart->has_discount('christmas25')) return;
    
    // Prevent using both coupons at the same time
    if (WC()->cart->has_discount('member2025')) {
        wc_add_notice('You cannot use both discount codes at the same time. Please remove one coupon.', 'error');
        WC()->cart->remove_coupon('member2025');
        return;
    }
    
    $cart_items = WC()->cart->get_cart();
    $total_eligible = 0;
    
    // Collect prices only from products in "Kaffe" or "Coffee" categories
    foreach ($cart_items as $item) {
        $product = $item['data'];
        $product_id = $item['product_id'];
        
        // Handle variable products
        if ($product->is_type('variation')) {
            $product_id = $product->get_parent_id();
        }
        
        // Check if product belongs to "Kaffe" or "Coffee" category (use lowercase slugs)
        if (has_term(array('kaffe', 'coffee'), 'product_cat', $product_id)) {
            $price_excl_tax = wc_get_price_excluding_tax($product);
            $quantity = $item['quantity'];
            
            $total_eligible += $price_excl_tax * $quantity;
        }
    }
    
    // Calculate 25% discount
    $discount_amount = $total_eligible * 0.25;
    
    if ($discount_amount > 0) {
        // Add fee as taxable - WooCommerce will add VAT to match the product's tax
        WC()->cart->add_fee('25% Christmas discount', -$discount_amount, true);
    }
}
/**
 * ------------------------------------------------------------------------
 * - Free shipping on subscription:
 * ------------------------------------------------------------------------
 */
// Feature 1: Free shipping for products with free_subscription shipping class
add_filter('woocommerce_package_rates', 'free_subscription_shipping', 999, 2);
function free_subscription_shipping($rates, $package) {
    $has_free_subscription = false;
    
    foreach ($package['contents'] as $item) {
        $product = $item['data'];
        $shipping_class = $product->get_shipping_class();
        
        if ($shipping_class === 'free-subscription' || $shipping_class === 'free_subscription') {
            $has_free_subscription = true;
            break;
        }
    }
    
    if ($has_free_subscription) {
        foreach ($rates as $rate_id => $rate) {
            // Shipmondo methods
            if (strpos($rate_id, 'shipmondo:') === 0) {
                $rates[$rate_id]->cost = 0;
                $rates[$rate_id]->taxes = array();
            }
            
            // Levering til adresse
            if ($rate_id === 'flat_rate:27') {
                $rates[$rate_id]->cost = 0;
                $rates[$rate_id]->taxes = array();
            }
        }
    }
    
    return $rates;
}

// Feature 2: Free shipping for orders above 320 kr (edited from 300)
add_filter('woocommerce_package_rates', 'free_shipping_above_300', 999, 2);
function free_shipping_above_300($rates, $package) {
    $cart_subtotal = 0;
    
    foreach ($package['contents'] as $item) {
        $cart_subtotal += $item['line_total'];
    }
    
    if ($cart_subtotal >= 320) {
        foreach ($rates as $rate_id => $rate) {
            // Shipmondo methods
            if (strpos($rate_id, 'shipmondo:') === 0) {
                $rates[$rate_id]->cost = 0;
                $rates[$rate_id]->taxes = array();
            }
            
            // Levering til adresse
            if ($rate_id === 'flat_rate:27') {
                $rates[$rate_id]->cost = 0;
                $rates[$rate_id]->taxes = array();
            }
        }
    }
    
    return $rates;
}
/**
 * Add a conditional message to the WooCommerce "Completed order" email.
 */
add_action( 'woocommerce_email_order_details', function( $order, $sent_to_admin, $plain_text, $email ) {

    // Only for customer emails, and only when the status is completed email.
    if ( $sent_to_admin ) return;
    if ( ! is_a( $email, 'WC_Email' ) || $email->id !== 'customer_completed_order' ) return;
    if ( ! is_a( $order, 'WC_Order' ) ) return;

    // Detect shipping method (handles multiple shipping items too)
    $has_shipmondo = false;
    foreach ( $order->get_items( 'shipping' ) as $shipping_item ) {
        $method_title = $shipping_item->get_name();         // e.g. "Shipmondo"
        $method_id    = $shipping_item->get_method_id();    // e.g. "shipmondo"

        if ( stripos( $method_title, 'shipmondo' ) !== false || stripos( $method_id, 'shipmondo' ) !== false ) {
            $has_shipmondo = true;
            break;
        }
    }

    // Message output
    if ( $plain_text ) {
        echo "\n";
        if ( $has_shipmondo ) {
            echo "Your package has been shipped with GLS and is on its way\n";
        } else {
            echo "If you purchased for pick up in the café, it is waiting for you. If you purchased giftcard, it has been delivered to the stated e-mail.\n";
        }
        echo "\n";
    } else {
        echo '<div style="margin: 12px 0 18px;">';
        if ( $has_shipmondo ) {
            echo '<p><strong>Your package has been shipped with GLS and is on its way</strong></p>';
        } else {
            echo '<p>If you purchased for pick up in the café, it is waiting for you.<br>If you purchased giftcard, it has been delivered to the stated e-mail.</p>';
        }
        echo '</div>';
    }

}, 5, 4 );

/**
 * ------------------------------------------------------------------------
 * - Breadcrumbs shortcode: [bredcrumb]
 * ------------------------------------------------------------------------
 */
function custom_breadcrumb() {
    if (is_front_page()) { return ''; } // no breadcrumb on homepage

    global $post;
    ob_start();

    echo '<nav class="breadcrumb" aria-label="Breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">';

    $position = 1; // start at 1 since we're skipping Home

    // Single posts
    if (is_single()) {
        // Category / taxonomy (posts: category; portfolio: project-categories)
        if ($post->post_type === 'portfolio') {
            $terms = get_the_terms($post->ID, 'project-categories');
            if ($terms && !is_wp_error($terms)) {
                $term = $terms[0];
                echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
                echo '<a href="' . esc_url(get_term_link($term)) . '" itemprop="item"><span itemprop="name">' . esc_html($term->name) . '</span></a>';
                echo '<meta itemprop="position" content="' . $position++ . '" />';
                echo '</span>';
            }
        } else {
            $category = get_the_category();
            if ($category) {
                $cat_link = get_category_link($category[0]->term_id);
                echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
                echo '<a href="' . esc_url($cat_link) . '" itemprop="item"><span itemprop="name">' . esc_html($category[0]->name) . '</span></a>';
                echo '<meta itemprop="position" content="' . $position++ . '" />';
                echo '</span>';
            }
        }

        // Current post (ACF override if present)
        $custom_label = function_exists('get_field') ? get_field('breadcrumb_label', $post->ID) : '';
        $title = $custom_label ?: get_the_title();
        echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
        echo '<span itemprop="name">' . esc_html($title) . '</span>';
        echo '<meta itemprop="position" content="' . $position . '" />';
        echo '</span>';

    // Hierarchical pages
    } elseif (is_page() && !is_front_page()) {
        $ancestors = array_reverse(get_post_ancestors($post->ID));
        foreach ($ancestors as $ancestor) {
            $ancestor_label = function_exists('get_field') ? get_field('breadcrumb_label', $ancestor) : '';
            $ancestor_title = $ancestor_label ?: get_the_title($ancestor);
            echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
            echo '<a href="' . esc_url(get_permalink($ancestor)) . '" itemprop="item"><span itemprop="name">' . esc_html($ancestor_title) . '</span></a>';
            echo '<meta itemprop="position" content="' . $position++ . '" />';
            echo '</span>';
        }

        $custom_label = function_exists('get_field') ? get_field('breadcrumb_label', $post->ID) : '';
        $title = $custom_label ?: get_the_title();
        echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
        echo '<span itemprop="name">' . esc_html($title) . '</span>';
        echo '<meta itemprop="position" content="' . $position . '" />';
        echo '</span>';

    // Archives
    } elseif (is_archive()) {
        echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
        echo '<span itemprop="name">' . esc_html(post_type_archive_title('', false)) . '</span>';
        echo '<meta itemprop="position" content="' . $position . '" />';
        echo '</span>';

    // Search
    } elseif (is_search()) {
        echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
        echo '<span itemprop="name">Search results for: ' . esc_html(get_search_query()) . '</span>';
        echo '<meta itemprop="position" content="' . $position . '" />';
        echo '</span>';
    }

    echo '</nav>';

    return ob_get_clean();
}
add_shortcode('breadcrumb', 'custom_breadcrumb');

/**
 * Make the right-hand `.saren--coupon` apply coupons by creating & submitting
 * a real POST form to the cart with the correct WooCommerce nonce.
 */
add_action( 'wp_enqueue_scripts', function () {
	if ( function_exists( 'is_cart' ) && is_cart() ) {
		// Ensure jQuery is present (and give us the cart URL + a fresh nonce)
		wp_enqueue_script( 'jquery' );
		wp_register_script( 'saren-coupon', false, array( 'jquery' ), null, true );
		wp_enqueue_script( 'saren-coupon' );

		wp_localize_script( 'saren-coupon', 'sarenCoupon', array(
			'actionUrl' => wc_get_cart_url(),                  // e.g. https://theartisan.dk/shop-cart/
			'nonce'     => wp_create_nonce( 'woocommerce-cart' ),
			'referer'   => wc_get_cart_url(),
		) );

		wp_add_inline_script( 'saren-coupon', "
			jQuery(function($){
				$(document).on('click', '.saren--coupon [name=\"apply_coupon\"]', function(e){
					e.preventDefault();

					// Read code from your right-hand field
					var code = ($('#saren_coupon_code').val() || '').trim();
					if (!code) return;

					// Build a tiny form that posts exactly what Woo expects
					var form = document.createElement('form');
					form.method = 'POST';
					form.action = sarenCoupon.actionUrl;

					function add(name, value){
						var i = document.createElement('input');
						i.type = 'hidden';
						i.name = name;
						i.value = value;
						form.appendChild(i);
					}

					add('coupon_code', code);
					add('apply_coupon', 'Apply coupon');

					// Prefer the existing nonce on the page (if present), else use our fresh one
					var pageNonce = document.querySelector('[name=\"woocommerce-cart-nonce\"]');
					add('woocommerce-cart-nonce', pageNonce ? pageNonce.value : sarenCoupon.nonce);

					// Referer helps some setups
					add('_wp_http_referer', sarenCoupon.referer);

					document.body.appendChild(form);
					form.submit();
				});
			});
		" );
	}
}, 20 );

/**
 * Custom color to checkout
 
add_action( 'init', function () {
	delete_transient( 'wc_stripe_appearance' );
	delete_transient( 'wc_stripe_blocks_appearance' );
});*/

/**
 * Stripe UPE (Woo Stripe / WooPayments) — Payment form appearance
 * Text: #191919, Placeholder: #8a8a8a
 */
/**
 * Stripe/WooPayments appearance — text #191919, placeholder #8a8a8a
 * Works with BOTH: WooPayments (WooPay) and WooCommerce Stripe Gateway (UPE).
 */
function saren_get_stripe_appearance_obj() {
	$appearance             = new stdClass();
	$appearance->variables  = (object) [
		'colorText'            => '#191919',
		'colorTextPlaceholder' => '#8a8a8a',
		'colorBackground'      => '#ffffff',
		'fontSizeBase'         => '16px',
		'fontFamily'           => 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
		'borderRadius'         => '12px',
	];
	$appearance->rules      = (object) [
		'.Input'               => (object) [ 'color' => '#191919' ],
		'.Input::placeholder'  => (object) [ 'color' => '#8a8a8a' ],
		'.Input:focus'         => (object) [ 'boxShadow' => '0 0 0 2px rgba(0,0,0,.08)' ],
		'.Input--invalid'      => (object) [ 'color' => '#191919', 'boxShadow' => '0 0 0 2px rgba(176,0,32,.25)' ],
		'.Error'               => (object) [ 'color' => '#b00020' ],
	];
	// Optional extras:
	$appearance->labels            = 'floating'; // 'above' or 'floating'
	$appearance->disableAnimations = false;

	return $appearance;
}

/** WooPayments (WooPay) — Stripe Payment Element appearance */
add_filter( 'wcpay_elements_appearance', function( $appearance ) {
	// Ensure object shape
	if ( ! is_object( $appearance ) ) { $appearance = new stdClass(); }
	if ( empty( $appearance->variables ) ) { $appearance->variables = new stdClass(); }
	if ( empty( $appearance->rules ) ) { $appearance->rules = new stdClass(); }

	$new = saren_get_stripe_appearance_obj();
	$appearance->variables = $new->variables;
	$appearance->rules     = $new->rules;
	// labels/disableAnimations supported by WCPay too:
	$appearance->labels            = $new->labels;
	$appearance->disableAnimations = $new->disableAnimations;

	return $appearance;
}, 50 );

/** WooCommerce Stripe Gateway (UPE) — applies to both shortcode and block checkout */
add_filter( 'wc_stripe_upe_params', function( $params ) {
	$appearance = saren_get_stripe_appearance_obj();
	$params['appearance']       = $appearance; // shortcode checkout
	$params['blocksAppearance'] = $appearance; // block checkout
	return $params;
}, 50 );

/**
 * Clear ALL relevant Stripe/WooPayments appearance transients ONCE,
 * so you immediately see changes without waiting for cache expiry.
 */
add_action( 'init', function () {
	if ( get_option( 'saren_stripe_appearance_flushed' ) ) {
		return;
	}
	// WooCommerce Stripe Gateway
	delete_transient( 'wc_stripe_appearance' );         // shortcode
	delete_transient( 'wc_stripe_blocks_appearance' );  // blocks

	// WooPayments (WooPay)
	delete_transient( 'wcpay_upe_appearance' );
	delete_transient( 'wcpay_wc_blocks_upe_appearance' );
	delete_transient( 'wcpay_upe_add_payment_method_appearance' );
	delete_transient( 'wcpay_upe_bnpl_product_page_appearance' );
	delete_transient( 'wcpay_upe_bnpl_classic_cart_appearance' );
	delete_transient( 'wcpay_upe_bnpl_cart_block_appearance' );

	// Mark flushed so it doesn’t run every request
	update_option( 'saren_stripe_appearance_flushed', 1 );
}, 1 );

/**
 * Language switcher function
 */
function get_language_switch_url() {
    if (!is_singular()) {
        // If not viewing a single post/page/product, fallback to homepage or other URL
        return home_url('/');
    }

    global $post;

    // Get current page URL path
    $current_url = home_url(add_query_arg(array(), $GLOBALS['wp']->request));
    $current_path = parse_url($current_url, PHP_URL_PATH);

    // Read ACF fields for translated URLs
    $translated_en_url = get_field('translated_en_url', $post->ID);
    $translated_da_url = get_field('translated_da_url', $post->ID);

    // Determine current language by URL prefix (adjust if needed)
    if (strpos($current_path, '/da/') === 0) {
        // On Danish page — switch to English if available
        if ($translated_en_url) {
            return esc_url($translated_en_url);
        } else {
            // Fallback English homepage or similar
            return home_url('/en/');
        }
    } elseif (strpos($current_path, '/en/') === 0) {
        // On English page — switch to Danish if available
        if ($translated_da_url) {
            return esc_url($translated_da_url);
        } else {
            // Fallback Danish homepage or similar
            return home_url('/da/');
        }
    } else {
        // If no language prefix in URL, fallback to default (Danish homepage)
        return home_url('/da/');
    }
}
/**
 * Shortcode to call the switcher in html
*/

function language_switcher_shortcode() {
    $post_id = get_the_ID();

    if (!$post_id) return '';

    $translated_en_url = get_field('translated_en_url', $post_id);
    $translated_da_url = get_field('translated_da_url', $post_id);

    if ($translated_en_url) {
        $url = $translated_en_url;
        $label = 'EN';
    } elseif ($translated_da_url) {
        $url = $translated_da_url;
        $label = 'DA';
    } else {
        return ''; // No translation set
    }

    return '<a href="' . esc_url($url) . '" class="pe--button pb--background pb--normal language-switcher">' . esc_html($label) . '</a>';

}
add_shortcode('language_switcher', 'language_switcher_shortcode');

/**
 * Add custom hreflang tags for pages, posts, and CPTs
 */
function add_custom_hreflang_tags() {
    if ( ! is_singular() ) return;

    // Be defensive when resolving the current singular object
    global $wp_query;
    $obj = is_object( $wp_query ) ? $wp_query->get_queried_object() : null;
    $post_id = ( $obj && ! empty( $obj->ID ) ) ? intval( $obj->ID ) : 0;
    if ( ! $post_id ) {
        // Last-resort fallback
        $maybe_id = get_the_ID();
        if ( $maybe_id ) $post_id = intval( $maybe_id );
    }
    if ( ! $post_id ) {
        echo "\n<!-- hreflang: no post_id in wp_head -->\n";
        return;
    }

    $current_url = get_permalink( $post_id );
    if ( ! $current_url ) {
        echo "\n<!-- hreflang: no current_url -->\n";
        return;
    }

    // Optional ACF fields
    $translated_en_url = function_exists('get_field') ? get_field('translated_en_url', $post_id) : '';
    $translated_da_url = function_exists('get_field') ? get_field('translated_da_url', $post_id) : '';

    $links = [];

    // Detect language by full URL
    $is_en = ( strpos( $current_url, home_url('/en/') ) === 0 );
    $is_da = ( strpos( $current_url, home_url('/da/') ) === 0 );

    // Danish (use da-DK if you target Denmark specifically)
    if ( $translated_da_url ) {
        $links['da-DK'] = $translated_da_url;
    } elseif ( $is_da ) {
        $links['da-DK'] = $current_url; // self
    }

    // English
    if ( $translated_en_url ) {
        $links['en'] = $translated_en_url;
    } elseif ( $is_en ) {
        $links['en'] = $current_url; // self
    }

    echo "\n<!-- hreflang: ran; langs=" . esc_html( implode(',', array_keys($links)) ) . " -->\n";

    if ( empty( $links ) ) return;

    foreach ( $links as $lang => $href ) {
        echo '<link rel="alternate" hreflang="' . esc_attr($lang) . '" href="' . esc_url($href) . "\" />\n";
    }

    // Optional x-default (e.g., choose your primary entry)
    // echo '<link rel="alternate" hreflang="x-default" href="' . esc_url( home_url('/') ) . "\" />\n";
}
add_action('wp_head', 'add_custom_hreflang_tags', 99);

/**
 * Menu language swap
 */
add_filter('wp_nav_menu_args', function($args) {
    $url_path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $lang = (strpos($url_path, 'en') === 0) ? 'en' : 'da';

    $args['menu'] = ($lang === 'en') ? 360 : 147;
    return $args;
});



/**
 * ------------------------------------------------------------------------
 * - Saren Article: Featured Image shortcode [sa_featured_image]
 *   Pulls the current post's WP featured image into the .sa-hero-image container.
 *   Attributes:
 *     size     = WP image size (default: 'full')
 *     max      = CSS max-height (default: '500px')
 *     caption  = Custom caption text (default: uses attachment caption)
 *     post_id  = Explicit post ID (default: current post)
 *     url      = Manual image URL (overrides featured image)
 *     alt      = Manual alt text
 *     lazy     = 'true'/'false' (default: 'true')
 * ------------------------------------------------------------------------
 */
function sa_featured_image_shortcode($atts) {
    $atts = shortcode_atts([
        'size'    => 'full',
        'max'     => '500px',
        'caption' => '',
        'post_id' => '',
        'url'     => '',
        'alt'     => '',
        'lazy'    => 'true',
    ], $atts, 'sa_featured_image');

    $post_id = $atts['post_id'] ? (int) $atts['post_id'] : get_the_ID();
    $lazy    = ($atts['lazy'] === 'true') ? ' loading="lazy"' : '';

    // Manual URL takes priority
    if (!empty($atts['url'])) {
        $img_url = esc_url($atts['url']);
        $alt     = esc_attr($atts['alt'] ?: get_the_title($post_id));
        $caption = $atts['caption'];
    } else {
        // Get WordPress featured image
        $thumb_id = get_post_thumbnail_id($post_id);
        if (!$thumb_id) return '';

        $img_data = wp_get_attachment_image_src($thumb_id, $atts['size']);
        if (!$img_data) return '';

        $img_url = esc_url($img_data[0]);
        $alt     = esc_attr($atts['alt'] ?: get_post_meta($thumb_id, '_wp_attachment_image_alt', true) ?: get_the_title($post_id));

        // Caption: shortcode attr > attachment caption > empty
        $caption = $atts['caption'] ?: wp_get_attachment_caption($thumb_id);
    }

    $max_height = esc_attr($atts['max']);
    $caption_html = $caption ? '<figcaption>' . esc_html($caption) . '</figcaption>' : '';

    return '<figure class="sa-hero-image">
        <img src="' . $img_url . '" alt="' . $alt . '"' . $lazy . ' style="max-height:' . $max_height . '">
        ' . $caption_html . '
    </figure>';
}
add_shortcode('sa_featured_image', 'sa_featured_image_shortcode');

/**
 * ------------------------------------------------------------------------
 * - Saren Article: Full article header [sa_article_header]
 *   Outputs: breadcrumbs + category + h1 + subtitle + meta + hero image
 *   Attributes:
 *     category   = Category badge text (default: first post category)
 *     subtitle   = Subtitle text (default: post excerpt)
 *     author     = Author name (default: 'The Artisan')
 *     date       = Date text (default: post modified date)
 *     readtime   = Read time text (default: auto-calculated)
 *     image      = 'true'/'false' — include featured image (default: 'true')
 *     breadcrumb = 'true'/'false' — include breadcrumbs (default: 'true'). Set to 'false' if [breadcrumb] is used separately before the header.
 *     caption    = Image caption text
 *     max        = Image max-height (default: '500px')
 *     post_id    = Explicit post ID
 * ------------------------------------------------------------------------
 */
function sa_article_header_shortcode($atts) {
    $atts = shortcode_atts([
        'category'   => '',
        'subtitle'   => '',
        'author'     => 'The Artisan',
        'date'       => '',
        'readtime'   => '',
        'image'      => 'true',
        'breadcrumb' => 'true',
        'caption'    => '',
        'max'        => '500px',
        'post_id'    => '',
    ], $atts, 'sa_article_header');

    $post_id = $atts['post_id'] ? (int) $atts['post_id'] : get_the_ID();
    $post    = get_post($post_id);
    if (!$post) return '';

    // Category
    $cat_text = $atts['category'];
    if (!$cat_text) {
        $cats = get_the_category($post_id);
        $cat_text = $cats ? $cats[0]->name : '';
    }

    // Subtitle
    $subtitle = $atts['subtitle'] ?: get_the_excerpt($post_id);

    // Date
    $date = $atts['date'] ?: 'Opdateret: ' . get_the_modified_date('F Y', $post_id);

    // Read time (auto-calculate from content if not provided)
    $readtime = $atts['readtime'];
    if (!$readtime) {
        $word_count = str_word_count(strip_tags($post->post_content));
        $minutes    = max(1, ceil($word_count / 200));
        $readtime   = $minutes . ' min. læsning';
    }

    // Breadcrumbs (omit if breadcrumb="false" — used when [breadcrumb] is placed separately)
    $breadcrumbs = ($atts['breadcrumb'] === 'true') ? do_shortcode('[breadcrumb]') : '';

    ob_start();
    ?>
    <header class="sa-header">
        <?php if ($breadcrumbs) : ?>
            <div class="sa-breadcrumbs"><?php echo $breadcrumbs; ?></div>
        <?php endif; ?>
        <?php if ($cat_text) : ?>
            <span class="sa-category"><?php echo esc_html($cat_text); ?></span>
        <?php endif; ?>
        <h1><?php echo esc_html(get_the_title($post_id)); ?></h1>
        <?php if ($subtitle) : ?>
            <p class="sa-subtitle"><?php echo esc_html($subtitle); ?></p>
        <?php endif; ?>
        <div class="sa-meta">
            <span>Af <strong><?php echo esc_html($atts['author']); ?></strong></span>
            <span class="sa-meta-divider">·</span>
            <span><?php echo esc_html($date); ?></span>
            <span class="sa-meta-divider">·</span>
            <span><?php echo esc_html($readtime); ?></span>
        </div>
    </header>
    <?php

    // Featured image
    if ($atts['image'] === 'true') {
        echo do_shortcode('[sa_featured_image post_id="' . $post_id . '" caption="' . esc_attr($atts['caption']) . '" max="' . esc_attr($atts['max']) . '"]');
    }

    return ob_get_clean();
}
add_shortcode('sa_article_header', 'sa_article_header_shortcode');

/**
 * ------------------------------------------------------------------------
 * - Adds responsive labels, sorting, and search to tables with [data-table]
 * ------------------------------------------------------------------------
 */
add_action('wp_footer', function () {
  if (is_admin()) return; ?>
<script>
document.addEventListener('DOMContentLoaded', function () {
  // For each table marked with data-table
  document.querySelectorAll('table[data-table]').forEach(function(table){
    if (!table.tBodies.length) return;

    // Optional: auto add data-labels for mobile stacked layout
    var ths = (table.tHead && table.tHead.rows[0]) ? Array.from(table.tHead.rows[0].cells) : [];
    if (ths.length) {
      Array.from(table.tBodies[0].rows).forEach(function(tr){
        Array.from(tr.cells).forEach(function(td, i){
          if (!td.hasAttribute('data-label') && ths[i]) {
            td.setAttribute('data-label', ths[i].textContent.trim());
          }
        });
      });
    }

    // Find the closest search input in the same content block
    // Supports either .table-tools input[type="search"] or #tableSearch
    var scope = table.closest('section, .content, article, main') || document;
    var input = scope.querySelector('.table-tools input[type="search"], #tableSearch');
    if (!input) return;

    // Live filter rows on input
    var rows = Array.from(table.tBodies[0].rows);
    input.addEventListener('input', function(){
      var q = this.value.trim().toLowerCase();
      rows.forEach(function(tr){
        var txt = tr.textContent.toLowerCase();
        tr.style.display = txt.indexOf(q) !== -1 ? '' : 'none';
      });
    }, { passive: true });
  });
});
</script>
<?php
}, 99);

/**
 * ------------------------------------------------------------------------
 * - Product Page SEO: Product Schema shortcode [sa_product_schema]
 *   Outputs JSON-LD Product structured data from WooCommerce product.
 *   Attributes:
 *     id = WooCommerce product ID (default: current post)
 * ------------------------------------------------------------------------
 */
function sa_product_schema_shortcode($atts) {
    $atts = shortcode_atts(['id' => ''], $atts, 'sa_product_schema');
    $product_id = $atts['id'] ? (int) $atts['id'] : get_the_ID();
    $product = wc_get_product($product_id);
    if (!$product) return '';

    $schema = [
        '@context' => 'https://schema.org',
        '@type'    => 'Product',
        'name'        => $product->get_name(),
        'description' => wp_strip_all_tags($product->get_short_description()),
        'sku'         => $product->get_sku(),
        'brand'       => [
            '@type' => 'Brand',
            'name'  => 'The Artisan',
        ],
        'offers' => [
            '@type'         => 'Offer',
            'url'           => get_permalink($product_id),
            'priceCurrency' => get_woocommerce_currency(),
            'price'         => $product->get_price(),
            'availability'  => $product->is_in_stock()
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
        ],
    ];

    // Image
    $image_id = $product->get_image_id();
    if ($image_id) {
        $schema['image'] = wp_get_attachment_url($image_id);
    }

    // Optional ACF origin field
    if (function_exists('get_field')) {
        $origin = get_field('origin_country', $product_id);
        if ($origin) {
            $schema['countryOfOrigin'] = [
                '@type' => 'Country',
                'name'  => $origin,
            ];
        }
    }

    return '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>';
}
add_shortcode('sa_product_schema', 'sa_product_schema_shortcode');

/**
 * ------------------------------------------------------------------------
 * - Product Page SEO: FAQ Schema shortcodes
 *   [sa_faq_schema] ... [/sa_faq_schema]  — wrapper, outputs accordion + JSON-LD
 *   [sa_faq_item question="..."] answer [/sa_faq_item]  — individual Q&A
 * ------------------------------------------------------------------------
 */
function sa_faq_schema_shortcode($atts, $content = '') {
    global $sa_faq_items;
    $sa_faq_items = [];
    do_shortcode($content);

    if (empty($sa_faq_items)) return '';

    // Build visible accordion HTML
    $html = '<div class="sa-faq-section">';
    foreach ($sa_faq_items as $item) {
        $html .= '<details class="sa-faq__item">';
        $html .= '<summary>' . esc_html($item['question']) . '</summary>';
        $html .= '<p>' . wp_kses_post($item['answer']) . '</p>';
        $html .= '</details>';
    }
    $html .= '</div>';

    // Build FAQPage JSON-LD
    $entities = [];
    foreach ($sa_faq_items as $item) {
        $entities[] = [
            '@type' => 'Question',
            'name'  => $item['question'],
            'acceptedAnswer' => [
                '@type' => 'Answer',
                'text'  => wp_strip_all_tags($item['answer']),
            ],
        ];
    }

    $schema = [
        '@context'   => 'https://schema.org',
        '@type'      => 'FAQPage',
        'mainEntity' => $entities,
    ];

    $html .= '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>';

    return $html;
}
add_shortcode('sa_faq_schema', 'sa_faq_schema_shortcode');

function sa_faq_item_shortcode($atts, $content = '') {
    global $sa_faq_items;
    $atts = shortcode_atts(['question' => ''], $atts, 'sa_faq_item');
    if ($atts['question']) {
        $sa_faq_items[] = [
            'question' => $atts['question'],
            'answer'   => trim($content),
        ];
    }
    return '';
}
add_shortcode('sa_faq_item', 'sa_faq_item_shortcode');

/**
 * ------------------------------------------------------------------------
 * - Product Page: Freshness badge shortcode [sa_freshness]
 *   Shows a pulsing green dot with roast date.
 *   Attributes:
 *     id   = Product ID (default: current post)
 *     date = Manual date string (overrides ACF field)
 *     text = Custom trailing text (default: 'sendes inden 48 timer')
 * ------------------------------------------------------------------------
 */
function sa_freshness_shortcode($atts) {
    $atts = shortcode_atts([
        'id'   => '',
        'date' => '',
        'text' => 'sendes inden 48 timer',
    ], $atts, 'sa_freshness');

    $product_id = $atts['id'] ? (int) $atts['id'] : get_the_ID();

    // Get roast date: manual attr > ACF field > fallback
    $roast_date = $atts['date'];
    if (!$roast_date && function_exists('get_field')) {
        $roast_date = get_field('roast_date', $product_id);
    }
    if (!$roast_date) {
        $roast_date = date_i18n('j. F Y');
    }

    $trail = esc_html($atts['text']);

    return '<span class="sa-freshness">'
         . '<span class="sa-freshness__dot"></span>'
         . '<span class="sa-freshness__text">Ristet <strong>' . esc_html($roast_date) . '</strong> &mdash; ' . $trail . '</span>'
         . '</span>';
}
add_shortcode('sa_freshness', 'sa_freshness_shortcode');

/**
 * ------------------------------------------------------------------------
 * - Searchable Coffee Table [sa_coffee_table]
 *   SEO-focused product listing with search, expandable highlights,
 *   and Saren quick-add-to-cart integration.
 *   Attributes:
 *     category = product_cat slug (default: '' = all)
 *     limit    = max products (default: -1 = all)
 *     orderby  = WP_Query orderby (default: 'menu_order')
 *     order    = ASC|DESC (default: 'ASC')
 *     columns  = highlight columns to auto-generate (default: 'origin,process,roast')
 * ------------------------------------------------------------------------
 */
function sa_coffee_table_shortcode($atts) {
    $atts = shortcode_atts([
        'category' => '',
        'limit'    => -1,
        'orderby'  => 'menu_order',
        'order'    => 'ASC',
    ], $atts, 'sa_coffee_table');

    $args = [
        'post_type'      => 'product',
        'posts_per_page' => (int) $atts['limit'],
        'orderby'        => $atts['orderby'],
        'order'          => $atts['order'],
        'post_status'    => 'publish',
    ];

    if ($atts['category']) {
        $args['tax_query'] = [[
            'taxonomy' => 'product_cat',
            'field'    => 'slug',
            'terms'    => array_map('trim', explode(',', $atts['category'])),
        ]];
    }

    $products = new WP_Query($args);
    if (!$products->have_posts()) {
        return '<p>Ingen produkter fundet.</p>';
    }

    ob_start();
    ?>
    <div class="sa-coffee-table" id="sa-coffee-table">

        <div class="sa-coffee-table__search">
            <svg class="sa-coffee-table__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="sa-coffee-table__search-input" id="sa-coffee-search" placeholder="Søg efter kaffe" autocomplete="off">
        </div>

        <div class="sa-coffee-table__header">
            <span class="sa-coffee-table__col-product">Kaffe</span>
            <span class="sa-coffee-table__col-description">Om kaffen</span>
            <span class="sa-coffee-table__col-price">Pris</span>
            <span class="sa-coffee-table__col-actions"></span>
        </div>

        <div class="sa-coffee-table__list" id="sa-coffee-list">
            <?php while ($products->have_posts()) : $products->the_post();
                global $product;
                if (!$product || !is_a($product, 'WC_Product')) continue;

                $pid        = $product->get_id();
                $name       = $product->get_name();
                $permalink  = get_permalink($pid);
                $image      = wp_get_attachment_image_url($product->get_image_id(), 'thumbnail') ?: wc_placeholder_img_src('thumbnail');
                $price_html = $product->get_price_html();
                $short_desc = $product->get_short_description();
                $full_alt   = $name . ' kaffeboenner';

                // Pull meta from ACF / attributes
                $origin  = '';
                $process = '';
                $roast   = '';

                if (function_exists('get_field')) {
                    $origin = get_field('origin_country', $pid);
                }
                if (!$origin) {
                    $origin_attr = $product->get_attribute('pa_origin');
                    $origin = $origin_attr ?: '';
                }

                $process_attr = $product->get_attribute('pa_process');
                $process = $process_attr ?: '';

                $roast_attr = $product->get_attribute('pa_roast');
                $roast = $roast_attr ?: '';

                // Build highlights
                $highlights = [];
                if (function_exists('get_field')) {
                    $h1 = get_field('highlight_1', $pid);
                    $h2 = get_field('highlight_2', $pid);
                    $h3 = get_field('highlight_3', $pid);
                    if ($h1) $highlights[] = $h1;
                    if ($h2) $highlights[] = $h2;
                    if ($h3) $highlights[] = $h3;
                }
                // Auto-generate if not enough ACF highlights
                if (count($highlights) < 3) {
                    if ($origin && !in_array($origin, $highlights))
                        $highlights[] = 'Oprindelse: ' . $origin;
                    if ($process && !in_array($process, $highlights))
                        $highlights[] = 'Proces: ' . $process;
                    if ($roast && !in_array($roast, $highlights))
                        $highlights[] = 'Ristning: ' . $roast;
                    if ($short_desc && count($highlights) < 3)
                        $highlights[] = wp_strip_all_tags($short_desc);
                }
                $highlights = array_slice($highlights, 0, 3);

                // Search data string
                $search_data = strtolower(implode(' ', [$name, $origin, $process, $roast, wp_strip_all_tags($short_desc)]));
            ?>
            <div class="sa-coffee-table__row saren--single--product" data-product-id="<?php echo esc_attr($pid); ?>" data-search="<?php echo esc_attr($search_data); ?>">

                <div class="sa-coffee-table__main">
                    <div class="sa-coffee-table__image">
                        <a href="<?php echo esc_url($permalink); ?>">
                            <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($full_alt); ?>" loading="lazy" width="64" height="64">
                        </a>
                    </div>
                    <div class="sa-coffee-table__info">
                        <a href="<?php echo esc_url($permalink); ?>" class="sa-coffee-table__name"><?php echo esc_html($name); ?></a>
                        <?php if ($short_desc) : ?>
                            <p class="sa-coffee-table__desc"><?php echo esc_html(wp_trim_words(wp_strip_all_tags($short_desc), 18, '...')); ?></p>
                        <?php endif; ?>
                        <div class="sa-coffee-table__meta">
                            <?php if ($origin) : ?><span><?php echo esc_html($origin); ?></span><?php endif; ?>
                            <?php if ($process) : ?><span><?php echo esc_html($process); ?></span><?php endif; ?>
                            <?php if ($roast) : ?><span><?php echo esc_html($roast); ?></span><?php endif; ?>
                        </div>
                    </div>
                    <div class="sa-coffee-table__price">
                        <?php echo $price_html; ?>
                    </div>
                    <div class="sa-coffee-table__actions">
                        <button class="sa-coffee-table__expand" aria-label="Vis detaljer" type="button">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <button class="quick-add-to-cart-btn sa-coffee-table__cart" data-product-id="<?php echo esc_attr($pid); ?>" type="button">
                            <span class="quick--text">Tilfoej</span>
                            <span class="card-add-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="1em" height="1em"><path d="M460-620v-120H340v-40h120v-120h40v120h120v40H500v120h-40ZM292.31-115.38q-25.31 0-42.66-17.35-17.34-17.35-17.34-42.65 0-25.31 17.34-42.66 17.35-17.34 42.66-17.34 25.31 0 42.65 17.34 17.35 17.35 17.35 42.66 0 25.3-17.35 42.65-17.34 17.35-42.65 17.35Zm375.38 0q-25.31 0-42.65-17.35-17.35-17.35-17.35-42.65 0-25.31 17.35-42.66 17.34-17.34 42.65-17.34t42.66 17.34q17.34 17.35 17.34 42.66 0 25.3-17.34 42.65-17.35 17.35-42.66 17.35ZM80-820v-40h97.92l163.85 344.62h265.38q6.93 0 12.31-3.47 5.39-3.46 9.23-9.61L768.54-780h45.61L662.77-506.62q-8.69 14.62-22.61 22.93t-30.47 8.31H324l-48.62 89.23q-6.15 9.23-.38 20 5.77 10.77 17.31 10.77h435.38v40H292.31q-35 0-52.35-29.39-17.34-29.38-.73-59.38l60.15-107.23L152.31-820H80Z"/></svg>
                            </span>
                            <svg class="cart-loading" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z"/></svg>
                        </button>
                    </div>
                </div>

                <?php if (!empty($highlights)) : ?>
                <div class="sa-coffee-table__details">
                    <ul class="sa-coffee-table__highlights">
                        <?php foreach ($highlights as $hl) : ?>
                            <li><?php echo esc_html($hl); ?></li>
                        <?php endforeach; ?>
                    </ul>
                    <div class="pe--button pb--underlined pb--small sa-coffee-table__link">
                        <div class="pe--button--wrapper">
                            <a href="<?php echo esc_url($permalink); ?>">
                                <span class="pb__main">Se produkt<span class="pb__hover">Se produkt</span></span>
                            </a>
                        </div>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Quick add popup shell -->
                <div class="pop--behavior--center quick-add-to-cart-popup quick_pop_id-<?php echo esc_attr($pid); ?>" data-product-id="<?php echo esc_attr($pid); ?>" style="display:none">
                    <span class="pop--overlay"></span>
                    <div class="pe--styled--popup quick-atc-popup">
                        <span class="pop--close">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m291-240-51-51 189-189-189-189 51-51 189 189 189-189 51 51-189 189 189 189-51 51-189-189-189 189Z"/></svg>
                        </span>
                        <div class="saren--popup--cart--product">
                            <div class="saren--popup--cart-product-image">
                                <img class="spcp--img" src="">
                            </div>
                            <div class="saren--popup--cart-product-meta">
                                <div class="saren--popup--cart-product-cont">
                                    <h6 class="spcp--price"></h6>
                                    <h4 class="spcp--title"></h4>
                                    <p class="spcp--desc no-margin"></p>
                                </div>
                                <div class="saren--popup--cart-product-form"></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <?php endwhile; ?>
        </div>
    </div>

    <script>
    (function() {
        var input = document.getElementById('sa-coffee-search');
        var list  = document.getElementById('sa-coffee-list');
        if (!input || !list) return;

        input.addEventListener('input', function() {
            var q = this.value.toLowerCase().trim();
            var rows = list.querySelectorAll('.sa-coffee-table__row');
            rows.forEach(function(row) {
                var data = row.getAttribute('data-search') || '';
                row.style.display = (!q || data.indexOf(q) !== -1) ? '' : 'none';
            });
        });

        list.addEventListener('click', function(e) {
            var expandBtn = e.target.closest('.sa-coffee-table__expand');
            if (!expandBtn) return;
            var row = expandBtn.closest('.sa-coffee-table__row');
            if (row) row.classList.toggle('expanded');
        });
    })();
    </script>
    <?php

    wp_reset_postdata();
    return ob_get_clean();
}
add_shortcode('sa_coffee_table', 'sa_coffee_table_shortcode');

/**
 * ------------------------------------------------------------------------
 * - Category Hero [sa_category_hero]
 *   Full-width hero banner auto-featuring a product from the given category.
 *   Pulls product image, name, short description, price from WooCommerce.
 *   Attributes:
 *     category  = product_cat slug (required)
 *     heading   = h1 text override (default: category name)
 *     subtitle  = subtitle text
 *     cta_text  = CTA button label (default: "Se alle produkter")
 *     cta_url   = CTA link (default: #sa-coffee-table)
 *     product_id = force a specific product (default: auto-select featured/newest)
 * ------------------------------------------------------------------------
 */
function sa_category_hero_shortcode($atts) {
    $atts = shortcode_atts([
        'category'   => '',
        'heading'    => '',
        'subtitle'   => '',
        'cta_text'   => 'Se alle produkter',
        'cta_url'    => '#sa-coffee-table',
        'product_id' => '',
    ], $atts, 'sa_category_hero');

    // --- Resolve the product to feature ---
    $product = null;

    if ($atts['product_id']) {
        $product = wc_get_product((int) $atts['product_id']);
    }

    if (!$product && $atts['category']) {
        // Try featured/sticky first
        $args = [
            'post_type'      => 'product',
            'posts_per_page' => 1,
            'post_status'    => 'publish',
            'meta_key'       => '_featured',
            'meta_value'     => 'yes',
            'tax_query'      => [[
                'taxonomy' => 'product_cat',
                'field'    => 'slug',
                'terms'    => $atts['category'],
            ]],
        ];
        $q = new WP_Query($args);
        if ($q->have_posts()) {
            $q->the_post();
            $product = wc_get_product(get_the_ID());
        }
        wp_reset_postdata();

        // Fallback: best-selling (total_sales) then newest
        if (!$product) {
            $args = [
                'post_type'      => 'product',
                'posts_per_page' => 1,
                'post_status'    => 'publish',
                'orderby'        => 'meta_value_num',
                'meta_key'       => 'total_sales',
                'order'          => 'DESC',
                'tax_query'      => [[
                    'taxonomy' => 'product_cat',
                    'field'    => 'slug',
                    'terms'    => $atts['category'],
                ]],
            ];
            $q = new WP_Query($args);
            if ($q->have_posts()) {
                $q->the_post();
                $product = wc_get_product(get_the_ID());
            }
            wp_reset_postdata();
        }
    }

    // --- Category name for heading fallback ---
    $heading = $atts['heading'];
    if (!$heading && $atts['category']) {
        $term = get_term_by('slug', $atts['category'], 'product_cat');
        $heading = $term ? $term->name : 'Vores Kaffe';
    }

    // --- Product data ---
    $prod_html = '';
    if ($product) {
        $pid       = $product->get_id();
        $name      = $product->get_name();
        $desc      = wp_strip_all_tags($product->get_short_description());
        $permalink = get_permalink($pid);
        $price_html = $product->get_price_html();
        $img_id    = $product->get_image_id();
        $img_url   = $img_id ? wp_get_attachment_image_url($img_id, 'medium_large') : wc_placeholder_img_src('medium_large');
        $img_alt   = $img_id ? (get_post_meta($img_id, '_wp_attachment_image_alt', true) ?: $name) : $name;

        // Pull ACF fields for specs
        $origin  = function_exists('get_field') ? get_field('origin_country', $pid) : '';
        if (!$origin) $origin = $product->get_attribute('pa_origin');
        $process = $product->get_attribute('pa_process');
        $roast   = $product->get_attribute('pa_roast');

        $prod_html = '
        <div class="sa-hero__product">
            <a href="' . esc_url($permalink) . '" class="sa-hero__product-image">
                <img src="' . esc_url($img_url) . '" alt="' . esc_attr($img_alt) . '" loading="eager">
            </a>
            <div class="sa-hero__product-info">
                <span class="sa-hero__product-badge">Udvalgt</span>
                <h3 class="sa-hero__product-name"><a href="' . esc_url($permalink) . '">' . esc_html($name) . '</a></h3>
                ' . ($desc ? '<p class="sa-hero__product-desc">' . esc_html(wp_trim_words($desc, 20, '...')) . '</p>' : '') . '
                <div class="sa-hero__product-meta">'
                    . ($origin ? '<span>' . esc_html($origin) . '</span>' : '')
                    . ($process ? '<span>' . esc_html($process) . '</span>' : '')
                    . ($roast ? '<span>' . esc_html($roast) . '</span>' : '') .
                '</div>
                <div class="sa-hero__product-price">' . $price_html . '</div>
                <div class="pe--button pb--bordered pb--normal sa-hero__product-btn">
                    <div class="pe--button--wrapper">
                        <a href="' . esc_url($permalink) . '">
                            <span class="pb__main">Se produkt<span class="pb__hover">Se produkt</span></span>
                        </a>
                    </div>
                </div>
            </div>
        </div>';
    }

    $subtitle_html = $atts['subtitle']
        ? '<p class="sa-hero__subtitle">' . esc_html($atts['subtitle']) . '</p>'
        : '';

    $breadcrumbs = do_shortcode('[breadcrumb]');

    ob_start();
    ?>
    <div class="sa-hero">
        <div class="sa-hero__inner">
            <header class="sa-hero__header">
                <div class="sa-hero__text">
                    <?php if ($breadcrumbs) : ?>
                        <div class="sa-breadcrumbs"><?php echo $breadcrumbs; ?></div>
                    <?php endif; ?>
                    <h1 class="sa-hero__heading"><?php echo esc_html($heading); ?></h1>
                <?php echo $subtitle_html; ?>
                <div class="pe--button pb--background pb--normal sa-hero__cta">
                    <div class="pe--button--wrapper">
                        <a href="<?php echo esc_url($atts['cta_url']); ?>">
                            <span class="pb__main"><?php echo esc_html($atts['cta_text']); ?><span class="pb__hover"><?php echo esc_html($atts['cta_text']); ?></span></span>
                        </a>
                    </div>
                </div>
            </div>
            </header>
            <?php echo $prod_html; ?>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('sa_category_hero', 'sa_category_hero_shortcode');

/**
 * ------------------------------------------------------------------------
 * - Product Showcase [sa_product_showcase]
 *   Mid-page immersive product feature with tasting notes, origin, and
 *   interactive hover. Auto-fetches products from WooCommerce.
 *   Attributes:
 *     category   = product_cat slug (required)
 *     count      = number of products (default: 3)
 *     heading    = section heading
 *     exclude    = comma-separated product IDs to skip
 *     orderby    = total_sales | date | rand | menu_order (default: total_sales)
 * ------------------------------------------------------------------------
 */
function sa_product_showcase_shortcode($atts) {
    $atts = shortcode_atts([
        'category' => '',
        'count'    => 3,
        'heading'  => 'Udvalgte kaffer',
        'exclude'  => '',
        'orderby'  => 'total_sales',
    ], $atts, 'sa_product_showcase');

    $args = [
        'post_type'      => 'product',
        'posts_per_page' => (int) $atts['count'],
        'post_status'    => 'publish',
    ];

    // Order
    if ($atts['orderby'] === 'total_sales') {
        $args['orderby']  = 'meta_value_num';
        $args['meta_key'] = 'total_sales';
        $args['order']    = 'DESC';
    } else {
        $args['orderby'] = $atts['orderby'];
        $args['order']   = ($atts['orderby'] === 'date') ? 'DESC' : 'ASC';
    }

    if ($atts['category']) {
        $args['tax_query'] = [[
            'taxonomy' => 'product_cat',
            'field'    => 'slug',
            'terms'    => array_map('trim', explode(',', $atts['category'])),
        ]];
    }

    if ($atts['exclude']) {
        $args['post__not_in'] = array_map('intval', explode(',', $atts['exclude']));
    }

    $products = new WP_Query($args);
    if (!$products->have_posts()) return '';

    ob_start();
    ?>
    <div class="sa-showcase">
        <div class="sa-showcase__header">
            <h2 class="sa-showcase__heading"><?php echo esc_html($atts['heading']); ?></h2>
            <p class="sa-showcase__sub">Håndplukket af vores ristere</p>
        </div>
        <div class="sa-showcase__grid">
            <?php while ($products->have_posts()) : $products->the_post();
                global $product;
                if (!$product || !is_a($product, 'WC_Product')) continue;

                $pid        = $product->get_id();
                $name       = $product->get_name();
                $permalink  = get_permalink($pid);
                $price_html = $product->get_price_html();
                $desc       = wp_strip_all_tags($product->get_short_description());
                $img_id     = $product->get_image_id();
                $img_url    = $img_id ? wp_get_attachment_image_url($img_id, 'medium_large') : wc_placeholder_img_src('medium_large');
                $img_alt    = $img_id ? (get_post_meta($img_id, '_wp_attachment_image_alt', true) ?: $name) : $name;

                // Meta
                $origin  = function_exists('get_field') ? get_field('origin_country', $pid) : '';
                if (!$origin) $origin = $product->get_attribute('pa_origin');
                $process = $product->get_attribute('pa_process');
                $roast   = $product->get_attribute('pa_roast');

                // Highlights
                $notes = [];
                if (function_exists('get_field')) {
                    $h1 = get_field('highlight_1', $pid);
                    $h2 = get_field('highlight_2', $pid);
                    $h3 = get_field('highlight_3', $pid);
                    if ($h1) $notes[] = $h1;
                    if ($h2) $notes[] = $h2;
                    if ($h3) $notes[] = $h3;
                }
            ?>
            <div class="sa-showcase__card">
                <a href="<?php echo esc_url($permalink); ?>" class="sa-showcase__image">
                    <img src="<?php echo esc_url($img_url); ?>" alt="<?php echo esc_attr($img_alt); ?>" loading="lazy">
                    <?php if ($roast) : ?>
                        <span class="sa-showcase__roast"><?php echo esc_html($roast); ?></span>
                    <?php endif; ?>
                </a>
                <div class="sa-showcase__body">
                    <h3 class="sa-showcase__name"><a href="<?php echo esc_url($permalink); ?>"><?php echo esc_html($name); ?></a></h3>
                    <?php if ($origin || $process) : ?>
                        <div class="sa-showcase__origin">
                            <?php if ($origin) : ?><span><?php echo esc_html($origin); ?></span><?php endif; ?>
                            <?php if ($process) : ?><span><?php echo esc_html($process); ?></span><?php endif; ?>
                        </div>
                    <?php endif; ?>
                    <?php if (!empty($notes)) : ?>
                        <div class="sa-showcase__notes">
                            <?php foreach ($notes as $note) : ?>
                                <span class="sa-showcase__note"><?php echo esc_html($note); ?></span>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                    <div class="sa-showcase__footer">
                        <div class="sa-showcase__price"><?php echo $price_html; ?></div>
                        <div class="pe--button pb--bordered pb--small sa-showcase__btn">
                            <div class="pe--button--wrapper">
                                <a href="<?php echo esc_url($permalink); ?>">
                                    <span class="pb__main">Se produkt<span class="pb__hover">Se produkt</span></span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endwhile; ?>
        </div>
    </div>
    <?php
    wp_reset_postdata();
    return ob_get_clean();
}
add_shortcode('sa_product_showcase', 'sa_product_showcase_shortcode');

/**
 * Replace breadcrumb home link text (Forside/Home) with a house SVG icon.
 */
function saren_breadcrumb_home_svg( $html, $crumbs, $breadcrumbs ) {
	if ( empty( $crumbs ) ) {
		return $html;
	}
	$home_label = isset( $crumbs[0][0] ) ? $crumbs[0][0] : '';
	$home_url   = isset( $crumbs[0][1] ) ? $crumbs[0][1] : home_url( '/' );
	if ( empty( $home_label ) ) {
		return $html;
	}
	$home_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';

	// Replace first home link: <a href="...">LABEL</a> or <a href="..."><span ...>LABEL</span></a>
	$label_escaped = preg_quote( $home_label, '#' );
	$patterns      = array(
		'#<a\s+href="[^"]*"[^>]*>\s*<span[^>]*>' . $label_escaped . '</span>\s*</a>#iu',
		'#<a\s+href="[^"]*"[^>]*>\s*' . $label_escaped . '\s*</a>#iu',
	);
	$replacement = '<a href="' . esc_url( $home_url ) . '" aria-label="' . esc_attr( $home_label ) . '">' . $home_svg . '</a>';
	foreach ( $patterns as $pattern ) {
		$new_html = preg_replace( $pattern, $replacement, $html, 1 );
		if ( $new_html !== $html ) {
			return $new_html;
		}
	}
	return $html;
}
add_filter( 'rank_math/frontend/breadcrumb/html', 'saren_breadcrumb_home_svg', 10, 3 );

/**
 * Allow SVG elements in breadcrumb output (for house icon) so wp_kses_post preserves it.
 */
function saren_kses_allow_breadcrumb_svg( $allowed_tags, $context ) {
	if ( 'post' !== $context ) {
		return $allowed_tags;
	}
	$allowed_tags['svg'] = array(
		'xmlns'       => true,
		'width'       => true,
		'height'      => true,
		'viewbox'     => true,
		'fill'        => true,
		'stroke'      => true,
		'stroke-width' => true,
		'stroke-linecap' => true,
		'stroke-linejoin' => true,
		'aria-hidden' => true,
	);
	$allowed_tags['path']    = array( 'd' => true );
	$allowed_tags['polyline'] = array( 'points' => true );
	return $allowed_tags;
}
add_filter( 'wp_kses_allowed_html', 'saren_kses_allow_breadcrumb_svg', 10, 2 );