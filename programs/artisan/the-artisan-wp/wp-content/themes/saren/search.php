<?php
/**
 * The template for displaying search results pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#search-result
 *
 * @package Saren
 */

get_header();
?>

<main id="primary" class="site-main">

    <div class="pe-section">

        <div class="pe-wrapper">

            <div class="pe-col-12">

                <?php if ( have_posts() ) : ?>


                <h4 class="page-title">
                    <?php
					/* translators: %s: search query. */
					printf( esc_html__( 'Search Results for: %s', 'saren' ), '<span>' . get_search_query() . '</span>' );
					?>
                </h4>

                <div class="pe-archive-grid">

                    <div class="pe-archive-grid-sizer"></div>
                    <div class="pe-archive-grid-gutter"></div>

                    <?php
			/* Start the Loop */
			while ( have_posts() ) :
				the_post();

				/**
				 * Run the loop for the search to output the results.
				 * If you want to overload this in a child theme then include a file
				 * called content-search.php and that will be used instead.
				 */
				get_template_part( 'template-parts/content', 'search' );

			endwhile;

		 ?>
                </div>
                
                <?php	
                
                 saren_posts_nav();
                
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
