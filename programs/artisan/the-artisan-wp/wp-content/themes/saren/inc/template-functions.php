<?php
/**
 * Functions which enhance the theme by hooking into WordPress
 *
 * @package Saren
 */

/**
 * Adds custom classes to the array of body classes.
 *
 * @param array $classes Classes for the body element.
 * @return array
 */
function saren_body_classes($classes)
{
    // Adds a class of hfeed to non-singular pages.
    if (!is_singular()) {
        $classes[] = 'hfeed';
    }

    // Adds a class of no-sidebar when there is no sidebar present.
    if (!is_active_sidebar('sidebar-1')) {
        $classes[] = 'no-sidebar';
    }

    if (class_exists("Redux")) {
        $option = get_option('pe-redux');

        if ($option['page_loader']) {
            $classes[] = 'page--loader--active';
        }

        if ($option['page_transitions']) {
            $classes[] = 'page--transitions--active';
        }

        $footerVisibility = 'show--footer';

        if (get_field('show_footer') !== null) {
            $footerVisibility = get_field('show_footer') ? 'show--footer' : 'hide--footer';
        }

        $classes[] = $footerVisibility;

        $classes[] = get_field('page_layout');

        $classes[] = 'loader__' . $option['loader_type'];

        if ($option['grain_overlay']) {
            $classes[] = 'body--grained';
        }

        $option['smooth_scroll'] || isset($_GET['smoothscroll']) ? $classes[] = 'smooth-scroll' : '';

        if (class_exists('RevSlider')) {
            $classes[] = 'rev--slider--active';
        }


    }

    return $classes;
}
add_filter('body_class', 'saren_body_classes');

/**
 * Add a pingback url auto-discovery header for single posts, pages, or attachments.
 */
function saren_pingback_header()
{
    if (is_singular() && pings_open()) {
        printf('<link rel="pingback" href="%s">', esc_url(get_bloginfo('pingback_url')));
    }
}
add_action('wp_head', 'saren_pingback_header');

function saren_excerpt_length($length)
{
    return 30;
}

add_filter('excerpt_length', 'saren_excerpt_length');

function saren_unset_url_field($fields)
{
    if (isset($fields['url']))
        unset($fields['url']);
    unset($fields['cookies']);
    return $fields;
}

add_filter('comment_form_default_fields', 'saren_unset_url_field');

function saren_comment_form_fields($comment_fields)
{
    if (isset($comment_fields['comment'])) {
        $comment_field = $comment_fields['comment'];
        unset($comment_fields['comment']);
        $comment_fields['comment'] = $comment_field;
    }

    return $comment_fields;
}

add_filter('comment_form_fields', 'saren_comment_form_fields', 10, 1);

function saren_comment_placeholders($fields)
{
    $fields['author'] = str_replace(
        '<input',
        '<input placeholder="'
        /* Replace 'theme_text_domain' with your theme’s text domain.
         * I use _x() here to make your translators life easier. :)
         * See http://codex.wordpress.org/Function_Reference/_x
         */
        . _x(
            'Your Name',
            'comment form placeholder',
            'saren'
        )
        . '"',
        $fields['author']
    );

    $fields['email'] = str_replace(
        '<input id="email"',
        /* We use a proper type attribute to make use of the browser’s
         * validation, and to get the matching keyboard on smartphones.
         */
        '<input id="email" placeholder="' . esc_html('contact@example.com', 'saren') . '"',
        $fields['email']
    );


    return $fields;
}

add_filter('comment_form_default_fields', 'saren_comment_placeholders');

function saren_textarea_placeholder($saren_textarea)
{
    $saren_textarea['comment_field'] = str_replace(
        '<textarea',
        '<textarea placeholder="' . esc_html('Write your comment here', 'saren') . '"',
        $saren_textarea['comment_field']
    );
    return $saren_textarea;
}

add_filter('comment_form_defaults', 'saren_textarea_placeholder');

if (!function_exists('saren_comments')) {

    function saren_comments($comment, $args, $depth)
    {
        $GLOBALS['comment'] = $comment;
        $is_pingback_comment = $comment->comment_type == 'pingback';
        $comment_class = 'comment';
        if ($is_pingback_comment) {
            $comment_class .= ' pingback-comment';
        }
        ?>

        <li>
            <div class="<?php echo esc_attr($comment_class); ?>">
                <div class="comment-meta">
                    <?php if (!$is_pingback_comment) { ?>
                        <div class="image"> <?php echo get_avatar($comment, 75); ?> </div>
                    <?php } ?>

                    <div class="comment-usr">

                        <h6 class="name">
                            <?php if ($is_pingback_comment) {
                                esc_html_e('Pingback:', 'saren');
                            } ?>         <?php echo get_comment_author_link(); ?>
                        </h6>
                        <span class="comment_date"><?php comment_date(); ?></span>

                    </div>

                </div>

                <div class="text_holder" id="comment-<?php echo comment_ID(); ?>">
                    <?php comment_text(); ?>
                </div>

                <?php comment_reply_link(array_merge($args, array('depth' => $depth, 'max_depth' => $args['max_depth']))); ?>

            </div>

            <?php if ($comment->comment_approved == '0'): ?>
                <p><em><?php esc_html_e('Your comment is awaiting moderation.', 'saren'); ?></em></p>
            <?php endif; ?>
            <?php
    }
}


// Modify comments header text in comments
add_filter('saren_title_comments', 'child_title_comments');

function saren_child_title_comments()
{
    return esc_html__e(comments_number('<h3>No Responses</h3>', '<h3>1 Response</h3>', '<h3>% Responses...</h3>'), 'saren');
}




/**
 * Change the Tag Cloud's Font Sizes.
 */

function saren_tag_cloud_font_sizes(array $args)
{
    $args['smallest'] = '1';
    $args['largest'] = '1';
    $args['unit'] = 'em';

    return $args;
}
;

add_filter('widget_tag_cloud_args', 'saren_tag_cloud_font_sizes');


add_action('woocommerce_after_single_product', 'saren_output_related_products', 25);

function saren_output_related_products()
{

    $args = array(
        'posts_per_page' => 4,
        'orderby' => 'rand'
    );
    woocommerce_related_products(apply_filters('saren_output_related_products_args', $args));
}

add_filter('post_thumbnail_html', 'remove_thumbnail_dimensions', 10, 3);

function remove_thumbnail_dimensions($html, $post_id, $post_image_id)
{
    $html = preg_replace('/(width|height)=\"\d*\"\s/', "", $html);
    return $html;
}

/**
 * Check if WooCommerce is activated
 */
if (!function_exists('is_woocommerce_activated')) {
    function is_woocommerce_activated()
    {
        if (class_exists('woocommerce')) {
            return true;
        } else {
            return false;
        }
    }
}

add_filter('wp_nav_menu_objects', 'saren_wp_nav_menu_objects', 10, 2);

function saren_wp_nav_menu_objects($items, $args)
{

    echo '<span class="sub--wrap--overlay"></span>';

    // loop
    foreach ($items as $key => $item) {

        $hasChildren = get_field('add_sub', $item);

        if ($hasChildren && get_field('select_template', $item)) {

            $template = get_field('select_template', $item);
            $reveal = get_field('sub_reveal_style', $item);
            $overlay = get_field('overlay_at_hover', $item);
            $id = $template->ID;

            if (function_exists('icl_object_id')) {
                $id = icl_object_id($id, 'elementor_library', true, ICL_LANGUAGE_CODE);
            }

            $items[$key]->classes[] = 'saren-has-children';
            $items[$key]->classes[] = 'sub_id_' . $id;

            echo '<div data-overlay="' . $overlay . '" class="saren-sub-menu-wrap reveal--style--' . $reveal . ' sub_' . $id . '">' . \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($id) . '</div>';
        }
    }
    // return
    return $items;
}

function change_post_types_slug($args, $post_type)
{
    if ('woo_product_tab' === $post_type) {
        $args['public'] = true;
        $args['publicly_queryable'] = true;
    }
    return $args;
}
add_filter('register_post_type_args', 'change_post_types_slug', 10, 2);

function enable_elementor_for_custom_post_type($elementor_is_enabled, $post)
{
    if ('woo_product_tab' === $post->post_type) {
        return true;
    }
    return $elementor_is_enabled;
}
add_filter('elementor/permission/post_type', 'enable_elementor_for_custom_post_type', 10, 2);


function shop_archive_css()
{

    if (!class_exists('WooCommerce')) { 
        return false;
    }
    
    if (class_exists("Redux")) {
        if (is_shop() || is_product_category() || is_product_tag()) {

            $option = get_option('pe-redux');
            $custom_css = '
            .woo-products-archive .saren--product--extras>div.saren--single--product--attributes>div , .woo-products-archive .saren--product--extras>div.saren--single--product--attributes {
                 justify-content: ' . $option['prouct_extras_alignment_column'] . ';
                 align-items: ' . $option['prouct_extras_alignment_column'] . ';
            }

            .woo-products-archive .saren--product--meta {
                text-align: ' . $option['prouct_metas_alignment'] . '
            }

            .woo-products-archive .saren--product--actions {
                justify-content: ' . $option['actions_alignment'] . '

            }
         
            .shop-page-header .page-title {
                text-align: ' . $option['shop_page_title_alignment'] . '

            }
         
        ';

            echo "<style>{$custom_css}</style>";
        }
    }
}
add_action('wp_head', 'shop_archive_css');
