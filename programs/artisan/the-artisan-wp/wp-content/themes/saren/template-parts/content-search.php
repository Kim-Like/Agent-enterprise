<?php
/**
 * Template part for displaying results in search pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Saren
 */

$classes = [];
$classes[] = 'pe-archive-post';
$classes[] = has_post_thumbnail() ? 'has_thumb' : 'no_thumb';


?>

<article id="post-<?php the_ID(); ?>" <?php post_class($classes); ?>>

    <div class="pe-archive-post-thumbnail">

        <?php saren_post_thumbnail(); ?>

    </div>

    <div class="pe-archive-post-details">

        <?php
			the_title( '<h5 class="entry-title"><a href="' . esc_url( get_permalink() ) . '" rel="bookmark">', '</a></h5>' );
	

		if ('post' === get_post_type() ) :
			?>
        <div class="pe-archive-post-meta">
            <?php
				saren_posted_on();
				?>
        </div><!-- .entry-meta -->
        <?php endif; ?>
        
        <div class="pe-archive-post-excerpt">
            
            <?php the_excerpt(); ?>
        
        </div>
        
        <div class="pe-archive-post-button">
            
            <a class="underlined" href="<?php the_permalink() ?>">Read More</a>
        
        </div>

    </div>

</article><!-- #post-<?php the_ID(); ?> -->
