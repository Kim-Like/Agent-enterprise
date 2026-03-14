<?php
/**
 * The template for displaying single portfolio posts
 *
 * Child theme override: adds breadcrumb inside the project-hero structure.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package Saren
 */

get_header();

if (class_exists("Redux")) {
    $option = get_option('pe-redux');
} ?>

<main id="primary" class="site-main" <?php echo saren_barba(false) ?>>

    <!-- Single Project -->
    <div class="project-page">

        <div class="project-hero">
            <?php
            $breadcrumbs = do_shortcode('[breadcrumb]');
            if ($breadcrumbs) : ?>
                <header class="project-hero__header">
                    <div class="sa-breadcrumbs"><?php echo $breadcrumbs; ?></div>
                </header>
            <?php endif; ?>
            <?php saren_project_hero(); ?>
        </div>

    <!-- Page Content -->
    <div id="content" class="page-content project-page-content">

    <?php
    while (have_posts()) :
        the_post();
        ?>

        <?php
        the_content(sprintf(
            wp_kses(
                /* translators: %s: Name of current post. Only visible to screen readers */
                __('Continue reading<span class="screen-reader-text"> "%s"</span>', 'saren'),
                array(
                    'span' => array(
                        'class' => array(),
                    ),
                )
            ),
            get_the_title()
        )); ?>

    </div>

    <div class="next-project-section">
        <?php saren_next_project(); ?>
    </div>

    </div>
    <!--/ Single Project -->

    <?php endwhile; ?>
</main><!-- #main -->

<?php get_footer(); ?>
