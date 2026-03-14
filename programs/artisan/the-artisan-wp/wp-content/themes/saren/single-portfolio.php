<?php
/**
 * The template for displaying all single posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package Saren
 */

get_header();

if (class_exists("Redux")) { 

  $option = get_option('pe-redux');
}  ?>

<main id="primary" class="site-main" <?php echo saren_barba(false) ?>>

    <!-- Single Project -->
    <div class="project-page">

        <div class="project-hero">
            
            <?php saren_project_hero() ?>
        
        </div>

    <!-- Page Content -->
    <div id="content" class="page-content project-page-content">
               
    <?php
		while ( have_posts() ) :
    
            function is_first() {
            global $post;
            $loop = get_posts( 'numberposts=1&order=ASC' );
            $first = $loop[0]->ID; 
            return ( $post->ID == $first ) ? true : false;
            }
    
			the_post();

    ?>


        <?php
		  the_content( sprintf(
			wp_kses(
				/* translators: %s: Name of current post. Only visible to screen readers */
				__( 'Continue reading<span class="screen-reader-text"> "%s"</span>', 'saren' ),
				array(
					'span' => array(
						'class' => array(),
					),
				)
			),
			get_the_title()
		) ); ?>


    </div>

    <div class="next-project-section">
      
    <?php saren_next_project() ?>
    
  </div>


    </div>
    <!--/ Single Project -->


    <?php
		endwhile; // End of the loop.
		?>
</main><!-- #main -->
<?php 

get_footer(); 

?>
