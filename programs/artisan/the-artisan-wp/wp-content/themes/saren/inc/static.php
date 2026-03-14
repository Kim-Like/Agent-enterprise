<?php

/*
Register Google Fonts
*/

function enqueue_fonts()
{
	wp_enqueue_style('general-sans-font', get_template_directory_uri() . '/assets/fonts/fonts.css', array(), null);
}

add_action('wp_enqueue_scripts', 'enqueue_fonts');

/**
 * Enqueue Woo Block Styles
 */
function saren_woo_styles_footer()
{
	if (!is_admin()) {
		wp_enqueue_style('woo-blocks', get_template_directory_uri() . '/css/woocommerce-blocks.css', array(), null);
	}
}
add_action('wp_footer', 'saren_woo_styles_footer', 5);

/**
 * Enqueue scripts
 */
function saren_scripts_styles()
{

	wp_enqueue_style('plugins', get_template_directory_uri() . '/css/plugins.css');

	wp_enqueue_style('style', get_stylesheet_uri(), array());

	if (is_rtl()) {
		wp_enqueue_style('style-rtl', get_template_directory_uri() . '/style-rtl.css', array('style'));
	}

	if (class_exists("Redux")) {
		static $redux_options = null;
		if (is_null($redux_options)) {
			$redux_options = get_option('pe-redux');
		}
		if (!empty($redux_options['pe_lotties'])) {
			wp_enqueue_script('dotlottie', get_template_directory_uri() . '/js/dotlottie-player.js', [], null, true);
		}
		if (!empty($redux_options['page_transitions'])) {
			wp_enqueue_script('barba', get_template_directory_uri() . '/js/barba.min.js', [], null, true);
		}
	}

	wp_enqueue_script('gsap', get_template_directory_uri() . '/js/gsap.min.js', [], '3.12.5', ['strategy' => 'defer', 'in_footer' => true,]);
	wp_enqueue_script('lenis', get_template_directory_uri() . '/js/lenis.min.js', [], null, ['strategy' => 'defer', 'in_footer' => true,]);
	wp_enqueue_script('gsap-plugins', get_template_directory_uri() . '/js/gsap-plugins.min.js', ['gsap'], null, ['strategy' => 'defer', 'in_footer' => true,]);
	wp_enqueue_script('plugins', get_template_directory_uri() . '/js/plugins.min.js', array('jquery'), '', ['strategy' => 'defer', 'in_footer' => true,]);
	wp_enqueue_script('scripts', get_template_directory_uri() . '/js/scripts.js', array('jquery'), '', ['strategy' => 'defer', 'in_footer' => true,]);

	if (is_singular() && comments_open() && get_option('thread_comments')) {
		wp_enqueue_script('comment-reply');
	}

	wp_enqueue_script("pe-wishlist", get_template_directory_uri() . "/js/wishlist.js", ["jquery"], null, ['strategy' => 'defer', 'in_footer' => true,]);

	wp_localize_script("pe-wishlist", "woocommerce_params", [
		"ajax_url" => admin_url("admin-ajax.php"),
		"is_user_logged_in" => is_user_logged_in() ? "1" : "0",
	]);

	wp_enqueue_script("pe-compare", get_template_directory_uri() . "/js/compare.js", ["jquery"], null, ['strategy' => 'defer', 'in_footer' => true,]);

	wp_localize_script("pe-compare", "woocommerce_params", [
		"ajax_url" => admin_url("admin-ajax.php"),
		"is_user_logged_in" => is_user_logged_in() ? "1" : "0",
	]);

}
add_action('wp_enqueue_scripts', 'saren_scripts_styles');
add_filter('wp_enqueue_scripts', 'saren_scripts_styles', 0);


?>