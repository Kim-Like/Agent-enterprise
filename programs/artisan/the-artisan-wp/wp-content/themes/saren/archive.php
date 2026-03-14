<?php
/**
 * The template for displaying archive pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Saren
 */

get_header();
?>

<main id="primary" class="site-main" <?php echo saren_barba(false) ?>>

    <div class="pe-section">

        <div class="pe-wrapper">

            <div class="pe-col-12">

                <?php if ( have_posts() ) : ?>

                <?php
				the_archive_title( '<h2 class="page-title">', '</h2>' );
				the_archive_description( '<div class="archive-description">', '</div>' );
				?>

                <div class="pe-archive-grid">

                    <div class="pe-archive-grid-sizer"></div>
                    <div class="pe-archive-grid-gutter"></div>

                    <?php
			/* Start the Loop */
			while ( have_posts() ) :
				the_post();

				/*
				 * Include the Post-Type-specific template for the content.
				 * If you want to override this in a child theme, then include a file
				 * called content-___.php (where ___ is the Post Type name) and that will be used instead.
				 */
				get_template_part( 'template-parts/content', get_post_type() );

			endwhile; 
                    
                    ?>

                </div>

                <?php saren_posts_nav();
              
		else :

			get_template_part( 'template-parts/content', 'none' );

		endif;
		?>

            </div>
        </div>



    </div>

</main><!-- #main -->

<?php

get_footer();
