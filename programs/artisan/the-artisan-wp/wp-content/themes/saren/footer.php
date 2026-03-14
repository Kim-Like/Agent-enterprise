<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package Saren
 */

if (class_exists("Redux")) {
    $option = get_option('pe-redux');
    $footerFixed = $option['footer_fixed'] ? 'footer--fixed' : '';
    $footerLink = $option['footer-link'];
    $footerText = $option['footer-text'];

} else {
    $footerFixed = '';

    $footerLink = 'https://pethemes.com';
    $footerText = 'Pe Themes';
}

?>

<?php if (saren_footer_template()) { ?>

    <footer id="colophon" class="site-footer <?php echo esc_attr($footerFixed) ?> footer--overlay">

        <?php echo saren_footer_template() ?>


    </footer><!-- #colophon -->
<?php } else { ?>

    <footer id="colophon" class="site-footer pe-section">

        <div class="pe-wrapper">

            <div class="site-info">

                <a href="<?php echo esc_url(__('https://pethemes.com/', 'saren')); ?>">
                    <?php
                    /* translators: %s: CMS name, i.e. WordPress. */
                    printf(esc_html__('Proudly powered by %s', 'saren'), 'PeThemes');
                    ?>
                </a>

                <span class="sep"> | </span>

                <?php
                /* translators: 1: Theme name, 2: Theme author. */
                printf(esc_html__('Theme: %1$s by %2$s.', 'saren'), 'saren', '<a href="' . esc_url($footerLink) . '">' . esc_html($footerText) . '</a>');
                ?>
            </div><!-- .site-info -->

        </div>
    </footer><!-- #colophon -->

<?php } ?>

</div><!-- #page -->

<?php wp_footer(); ?>

</body>

</html>