<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * E.g., it puts together the home page when no home.php file exists.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Saren
 */

get_header();

if (class_exists("Redux")) {

    $option = get_option('pe-redux');


}


$sidebar = 'right-sidebar';
$archiveCol = $sidebar === 'right-sidebar' ? 'pe-col-9 sm-12' : 'pe-col-12';

?>


<main id="primary" class="site-main" <?php echo saren_barba(false) ?>>

    <div class="pe-section">

        <div class="pe-wrapper">

            <div class="<?php echo esc_attr($archiveCol); ?>">

                <div class="pe-archive-grid">

                    <div class="pe-archive-grid-sizer"></div>
                    <div class="pe-archive-grid-gutter"></div>

                    <?php
                    if (have_posts()):

                        if (is_home() && !is_front_page()):
                            ?>
                            <header>
                                <h1 class="page-title screen-reader-text"><?php single_post_title(); ?></h1>
                            </header>
                            <?php
                        endif;
                        ?>

                        <?php	/* Start the Loop */
                        while (have_posts()):

                            the_post();

                            /*
                             * Include the Post-Type-specific template for the content.
                             * If you want to override this in a child theme, then include a file
                             * called content-___.php (where ___ is the Post Type name) and that will be used instead.
                             */
                            get_template_part('template-parts/content', get_post_type());

                        endwhile;


                    else:

                        get_template_part('template-parts/content', 'none');

                    endif;
                    ?>

                </div>

                <?php saren_posts_nav(); ?>


            </div>

            <div class="pe-col-3 sm-12">

                <?php get_sidebar(); ?>

            </div>


        </div>

    </div>

</main><!-- #main -->

<?php

get_footer();
