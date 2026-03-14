<?php
/**
 * Template part for displaying posts in single post page
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Saren
 */


$classes = [];
$classes[] = 'single-blog-post';

$post_style = 'split';

?>

<article id="post-<?php the_ID(); ?>" <?php post_class($classes); ?>>

    

    <div class="pe-single-post-title">
        <?php the_title( '<h1 class="entry-title "><a href="' . esc_url( get_permalink() ) . '" rel="bookmark">', '</a></h2>' );
?>

    </div>
    
    <?php saren_post_thumbnail(); ?>

    <?php
		if ( 'post' === get_post_type() ) :
			?>
    <div class="entry-meta">
        <?php
				saren_posted_on();
				saren_posted_by();
				?>
    </div><!-- .entry-meta -->
    <?php endif; ?>




    <?php if (is_singular()) { ?>

    <div class="entry-content">
        <?php
		the_content(
			sprintf(
				wp_kses(
					/* translators: %s: Name of current post. Only visible to screen readers */
					__( 'Continue reading<span class="screen-reader-text"> "%s"</span>', 'saren' ),
					array(
						'span' => array(
							'class' => array(),
						),
					)
				),
				wp_kses_post( get_the_title() )
			)
		);

		wp_link_pages(
			array(
				'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'saren' ),
				'after'  => '</div>',
			)
		);
		?>
    </div><!-- .entry-content -->

    <?php } else {
    
    the_excerpt();
    
} ?>


</article><!-- #post-<?php the_ID(); ?> -->
