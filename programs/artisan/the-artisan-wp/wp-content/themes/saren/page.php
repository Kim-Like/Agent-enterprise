<?php
/**
 * The template for displaying all pages
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site may use a
 * different template.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Saren
 */

get_header();

if (class_exists("Redux")) { 

    $option = get_option('pe-redux');
    $pageTitle = get_field('page_title');
   
} else {
    $pageTitle = true;
  
}

?>

<main id="primary" class="site-main" <?php echo saren_barba(false) ?>>

    <?php if ($pageTitle) { ?>
        <div class="pe-section">

            <div class="pe-wrapper">

                <div class="pe-col-12">

                    <div class="page-heeader">

                        <div class="page-title">
                            <?php the_title('<h1 class="entry-title">', '</h1>'); ?>
                        </div>

                    </div>

                </div>
            </div>
        </div>

    <?php } ?>

    <?php if (!is_built_with_elementor()) { ?>


        <div class="pe-section">

            <div class="pe-wrapper">

                <div class="pe-col-12">

                <?php }

    while (have_posts()):
        the_post();

        get_template_part('template-parts/content', 'page');

    endwhile; // End of the loop.
    ?>

                <?php if (!is_built_with_elementor()) { ?>
                </div>
            </div>
        </div>
    <?php } ?>
</main><!-- #main -->

<?php

get_footer();
