<?php
/**
 * Custom template tags for this theme
 *
 * Eventually, some of the functionality here could be replaced by core features.
 *
 * @package Saren
 */


if (!function_exists('saren_posted_on')):
	/**
	 * Prints HTML with meta information for the current post-date/time.
	 */
	function saren_posted_on()
	{
		if (is_singular()) {

			$categories_list = get_the_category_list(esc_html__(', ', 'saren'));
			if ($categories_list) {
				/* translators: 1: list of categories. */
				printf('<div class="post-cats"><span class="cat-links">' . esc_html__('%1$s', 'saren') . '</span></div>', $categories_list); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}


			$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
			if (get_the_time('U') !== get_the_modified_time('U')) {
				$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
			}

			$time_string = sprintf(
				$time_string,
				esc_attr(get_the_date(DATE_W3C)),
				esc_html(get_the_date()),
				esc_attr(get_the_modified_date(DATE_W3C)),
				esc_html(get_the_modified_date())
			);

			$posted_on = sprintf(
				/* translators: %s: post date. */
				esc_html_x('%s', 'post date', 'saren'),
				'<a href="' . esc_url(get_permalink()) . '" rel="bookmark">' . $time_string . '</a>'
			);

			echo '<div class="post-date"><span class="post-meta-title">' . esc_html('Posted On', 'saren') . '</span><span class="posted-on">' . $posted_on . '</span></div>';

			/* translators: used between list items, there is a space after the comma */
			$tags_list = get_the_tag_list('', esc_html_x(' / ', 'list item separator', 'saren'));
			if ($tags_list) {
				/* translators: 1: list of tags. */
				printf('<div class="post-tags"><span class="post-meta-title">' . esc_html('Tags', 'saren') . '</span><span class="tags-links">' . esc_html__('Tagged %1$s', 'saren') . '</span></div>', $tags_list); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}


		} else {

			$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
			if (get_the_time('U') !== get_the_modified_time('U')) {
				$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
			}

			$time_string = sprintf(
				$time_string,
				esc_attr(get_the_date(DATE_W3C)),
				esc_html(get_the_date()),
				esc_attr(get_the_modified_date(DATE_W3C)),
				esc_html(get_the_modified_date())
			);

			$posted_on = sprintf(
				/* translators: %s: post date. */
				esc_html_x('%s', 'post date', 'saren'),
				'<a href="' . esc_url(get_permalink()) . '" rel="bookmark">' . $time_string . '</a>'
			);

			echo '<span class="posted-on">' . $posted_on . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

			$categories_list = get_the_category_list(esc_html__(', ', 'saren'));
			if ($categories_list) {
				/* translators: 1: list of categories. */
				printf('<span class="cat-links">' . esc_html__('%1$s', 'saren') . '</span>', $categories_list); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}

		}




	}
endif;

if (!function_exists('saren_posted_by')):
	/**
	 * Prints HTML with meta information for the current author.
	 */
	function saren_posted_by()
	{

		$byline = sprintf(
			/* translators: %s: post author. */
			esc_html_x('%s', 'post author', 'saren'),
			'<span class="author vcard"><a class="url fn n" href="' . esc_url(get_author_posts_url(get_the_author_meta('ID'))) . '">' . esc_html(get_the_author()) . '</a></span>'
		);

		echo '<div class="post-author"><span class="post-meta-title">' . esc_html('Posted By', 'saren') . '</span><span class="byline"> ' . $byline . '</span></div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
endif;

if (!function_exists('saren_entry_footer')):
	/**
	 * Prints HTML with meta information for the categories, tags and comments.
	 */
	function saren_entry_footer()
	{
		// Hide category and tag text for pages.
		if ('post' === get_post_type()) {
			/* translators: used between list items, there is a space after the comma */
			$categories_list = get_the_category_list(esc_html__(', ', 'saren'));
			if ($categories_list) {
				/* translators: 1: list of categories. */
				printf('<span class="cat-links">' . esc_html__('Posted in %1$s', 'saren') . '</span>', $categories_list); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}

			/* translators: used between list items, there is a space after the comma */
			$tags_list = get_the_tag_list('', esc_html_x(', ', 'list item separator', 'saren'));
			if ($tags_list) {
				/* translators: 1: list of tags. */
				printf('<span class="tags-links">' . esc_html__('Tagged %1$s', 'saren') . '</span>', $tags_list); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}
		}

		if (!is_single() && !post_password_required() && (comments_open() || get_comments_number())) {
			echo '<span class="comments-link">';
			comments_popup_link(
				sprintf(
					wp_kses(
						/* translators: %s: post title */
						__('Leave a Comment<span class="screen-reader-text"> on %s</span>', 'saren'),
						array(
							'span' => array(
								'class' => array(),
							),
						)
					),
					wp_kses_post(get_the_title())
				)
			);
			echo '</span>';
		}

		edit_post_link(
			sprintf(
				wp_kses(
					/* translators: %s: Name of current post. Only visible to screen readers */
					__('Edit <span class="screen-reader-text">%s</span>', 'saren'),
					array(
						'span' => array(
							'class' => array(),
						),
					)
				),
				wp_kses_post(get_the_title())
			),
			'<span class="edit-link">',
			'</span>'
		);
	}
endif;



if (!function_exists('saren_post_thumbnail')):
	/**
	 * Displays an optional post thumbnail.
	 *
	 * Wraps the post thumbnail in an anchor element on index views, or a div
	 * element when on single views.
	 */
	function saren_post_thumbnail()
	{
		if (post_password_required() || is_attachment() || !has_post_thumbnail()) {
			return;
		}

		if (is_singular()):
			?>

			<div class="post-thumbnail">
				<?php the_post_thumbnail(); ?>
			</div><!-- .post-thumbnail -->

		<?php else: ?>

			<a class="post-thumbnail" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
				<?php
				the_post_thumbnail(
					'post-thumbnail',
					array(
						'alt' => the_title_attribute(
							array(
								'echo' => false,
							)
						),
					)
				);
				?>
			</a>

			<?php
		endif; // End is_singular().
	}
endif;

if (!function_exists('wp_body_open')):
	/**
	 * Shim for sites older than 5.2.
	 *
	 * @link https://core.trac.wordpress.org/ticket/12563
	 */
	function wp_body_open()
	{
		do_action('wp_body_open');
	}
endif;

function saren_posts_nav()
{

	$ajax = false;
	$type = 'button'; // Pagination / Button / Scroll

	global $wp_query;

	$maxPages = $wp_query->max_num_pages;
	$paged = $wp_query->is_paged ? $wp_query->query['paged'] : '1';

	if ($maxPages != 1) {

		?>

		<div class="pe-theme-posts-nav type_<?php echo esc_attr($type); ?>" data-paged="<?php echo esc_attr($paged); ?>"
			data-max-pages="<?php echo esc_attr($maxPages); ?>">

			<?php

			if ($type === 'button') {

				?>

				<div class="pe_load_more">

					<?php echo get_next_posts_link('Load More Posts', 'saren'); ?>

				</div>


			<?php }
	
			echo '</div>';

	}
}


function is_built_with_elementor($post_id = null)
{
    if (!class_exists('\Elementor\Plugin')) {
        return false;
    }

    if (!$post_id) {
        $post_id = get_the_ID();
    }

    // Eğer $post_id hala geçerli bir ID değilse, işlemi sonlandır.
    if (!$post_id || !is_numeric($post_id)) {
        return false;
    }

    $document = \Elementor\Plugin::$instance->documents->get($post_id);

    // Eğer $document nesnesi boşsa, hata almamak için false döndür.
    if (!$document) {
        return false;
    }

    return $document->is_built_with_elementor();
}



function saren_header_classes($id = null)
{
	if (class_exists("Redux")) {

		$option = get_option('pe-redux');

		if ($id == null) {
			$id = get_the_ID();
		}

		$headerClasses = [];

		if ($option['auto_switch_header']) {
			$autoSwitch = 'header--auto--switch';
		} else {
			$autoSwitch = '';
		}

		if (get_field('header_behavior', $id) && (get_field('header_behavior', $id) !== 'default')) {

			$behavior = 'header--' . get_field('header_behavior', $id);

		} else {
			$behavior = 'header--' . $option['header_behavior'];
		}

		if (get_field('header_layout', $id) && (get_field('header_layout', $id) !== 'use--global')) {

			$layout = 'header--' . get_field('header_layout', $id);

		} else {
			$layout = 'header--' . $option['header_layout'];
		}

		array_push($headerClasses, $behavior);
		array_push($headerClasses, $layout);
		array_push($headerClasses, $autoSwitch);

		return esc_attr(implode(' ', $headerClasses));
	}
}

function saren_popups()
{

	if (class_exists("Redux")) {
		$option = get_option('pe-redux');

		if (isset($option['popups-repeater'])) {

			$popupsRepeater = $option['popups-repeater'];
			$popupTemplates = $popupsRepeater['select-popup-template'];

			if ($popupsRepeater['select-popup-template'][0]) {
				foreach ($popupTemplates as $key => $popup) {

					if (function_exists('icl_object_id')) {
						$popup = icl_object_id($popup, 'elementor_library', true, ICL_LANGUAGE_CODE);
					}

					$locations = $popupsRepeater['popup-show-on'][$key];
					if ($locations === 'pages') {
						$selectPages = $popupsRepeater['select-popup-pages'][$key];
					} else if ($locations === 'posts') {
						$selectPosts = $popupsRepeater['select-popup-posts'][$key];
					} else if ($locations === 'products') {
						$selectProducts = $popupsRepeater['select-popup-products'][$key];
					}

					if ($popupsRepeater['popup_disabled'][$key]) {
						return false;
					}

					if ($locations === 'pages' && !is_page()) {
						return false;
					}

					if ($locations === 'posts' && !is_single()) {
						return false;
					}

					if ($locations === 'products' && !is_product()) {
						return false;
					}

					if ($locations === 'pages' && $selectPages && !in_array(get_the_ID(), $selectPages)) {
						return false;
					}

					if ($locations === 'posts' && $selectPosts && !in_array(get_the_ID(), $selectPosts)) {
						return false;
					}

					if ($locations === 'products' && $selectProducts && !in_array(get_the_ID(), $selectProducts)) {
						return false;
					}

					if (is_woocommerce_page() || is_404()) {
						return false;
					}

					$displayDelay = $popupsRepeater['popup_display_delay'][$key];
					$overlay = $popupsRepeater['popup_overlay'][$key];
					$animation = $popupsRepeater['popup_animation'][$key];
					$disableScroll = $popupsRepeater['popup_disable_scroll'][$key] ? true : false;

					?>

						<div data-close-button="" class="saren--popup popup__<?php echo esc_attr($popup) ?>"
							data-location="<?php echo esc_attr($locations); ?>" data-display-delay="<?php echo esc_attr($displayDelay); ?>"
							data-disable-scroll="<?php echo esc_attr($disableScroll); ?>"
							data-animation="<?php echo esc_attr($animation) ?>">

							<?php if ($overlay) { ?>
								<span class="saren--popup--overlay"></span>
							<?php } ?>

							<span class="pop--close">
								<?php $svgPath = get_template_directory() . '/assets/img/remove.svg';
								$icon = file_get_contents($svgPath);
								echo $icon; ?>
							</span>

							<?php echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($popup);
							?>

						</div>

					<?php }
			}

		}

	}

}

function saren_mouse_cursor()
{
	if (class_exists("Redux")) {
		$option = get_option('pe-redux');


		if ($option['mouse_cursor']) {
			?>

				<div id="mouseCursor">

					<svg height="100%" width="100%" viewbox="0 0 100 100">
						<circle class="main-circle" cx="50" cy="50" r="50" />
					</svg>

					<span class="cursor-text"></span>
					<span class="cursor-icon">


					</span>


					<span class="cursor--drag--icons">

						<?php
						$leftIcon = file_get_contents(get_template_directory(). '/assets/img/chevron_left.svg');
						$rightIcon = file_get_contents(get_template_directory(). '/assets/img/chevron_right.svg');

						echo _e($leftIcon);
						echo _e($rightIcon);

						?>

					</span>

				</div>

			<?php }
	}
}


function saren_project_hero()
{

	$option = get_option('pe-redux');

	global $wp_query;
	$id = $wp_query->post->ID;

	$type = get_field('hero_style') === 'template' ? get_field('hero_template') : (get_field('hero_style') === 'global' ? $option['project_hero_template'] : '');

	if ($type) {

		if (function_exists('icl_object_id')) {
			$type = icl_object_id($type, 'elementor_library', true, ICL_LANGUAGE_CODE);
		}

		echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($type);
	}
}

function saren_next_project()
{
	$option = get_option('pe-redux');

	$template = $option['next_project_template'];

	if ($template) {

		if (function_exists('icl_object_id')) {
			$template = icl_object_id($template, 'elementor_library', true, ICL_LANGUAGE_CODE);
		}

		echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($template);
	}
}

function saren_project_image($postid, $custom, $hover)
{
	$option = get_option('pe-redux');

	global $wp_query;
	$id = $postid;

	if ($custom) {

		$type = $custom['type'];

	} else {

		$type = get_field('media_type', $id);
	}

	if ($type === 'image') {

		$image = $custom ? $custom['imageUrl']['id'] : get_field('image', $id);
		$size = 'full';

		?>

			<?php if ($hover === 'bulge') { ?>

				<div class="pe--bulge card is-visible" data-img="<?php echo wp_get_attachment_image_url($image, $size); ?>">
					<div class="card__content">
						<canvas class="card__canvas"></canvas>
						<?php echo wp_get_attachment_image($image, $size) ?>
					</div>
				</div>

			<?php } else {
				echo wp_get_attachment_image($image, $size);
			} ?>


		<?php } else if ($type === 'video') {

		$provider = $custom ? $custom['provider'] : get_field('video_provider', $id);
		$video_id = $custom ? $custom['videoId'] : get_field('video_id', $id);
		$self_video = $custom ? $custom['videoUrl'] : get_field('self_video', $id);

		?>

				<div class="pe-video pe-<?php echo esc_attr($provider) ?>" data-controls=false data-autoplay=true data-muted=true
					data-loop=true>

				<?php if ($provider === 'self') { ?>

						<video class="p-video" autoplay muted loop playsinline>
							<source src="<?php echo esc_url($self_video['url']); ?>">
						</video>

				<?php } else { ?>

						<div class="p-video" data-plyr-provider="<?php echo esc_attr($provider) ?>"
							data-plyr-embed-id="<?php echo esc_attr($video_id) ?>"></div>


				<?php } ?>

				</div>

		<?php }

}

function saren_header_template()
{
	if (class_exists("Redux")) {
		$option = get_option('pe-redux');
		$type = $option['header_type'];

		if ($type === 'template') {

			$id = $option['select-header-template'];

			if (function_exists('icl_object_id')) {
				$id = icl_object_id($id, 'elementor_library', true, ICL_LANGUAGE_CODE);
			}

			return \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($id);

		} else {

			return false;
		}
	}
}

function saren_footer_template()
{
	if (class_exists("Redux")) {
		$option = get_option('pe-redux');
		$type = $option['footer_template'];

		if ($type === 'template') {

			$id = $option['select-footer-template'];

			if (function_exists('icl_object_id')) {
				$id = icl_object_id($id, 'elementor_library', true, ICL_LANGUAGE_CODE);
			}

			return \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($id);

		} else {

			return false;
		}
	}
}

function saren_post_template()
{
	if (class_exists("Redux")) {
		$option = get_option('pe-redux');

		if (isset($option['single_post_template'])) {

			$id = $option['single_post_template'];
			if (function_exists('icl_object_id')) {
				$id = icl_object_id($id, 'elementor_library', true, ICL_LANGUAGE_CODE);
			}

		} else {
			return false;
		}


		return \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($id);
	}

}

function saren_barba($body)
{
	if (class_exists("Redux")) {
		$option = get_option('pe-redux');

		$attr = '';
		if ($option['page_transitions']) {

			if ($body) {

				$attr = 'data-barba="wrapper"';

			} else {

				$attr = 'data-barba="container"';
			}
		}
		return $attr;
	}



}

function saren_page_loader()
{
	if (class_exists("Redux")) {
		$option = get_option('pe-redux');

		if ($option['page_loader']) {

			$typeSelect = $option['loader_type'];

			$type = 'pl__' . $option['loader_type'];

			if ($typeSelect === 'fade') {
				$direction = 'pl__' . $option['fade_direction'];
			} else if ($typeSelect === 'rows') {
				$direction = 'pl__' . $option['rows_direction'];
			} else if ($typeSelect === 'columns') {
				$direction = 'pl__' . $option['columns_direction'];
			} else {
				$direction = 'pl__' . $option['loader_direction'];
			}

			if ($typeSelect = 'columns' || $typeSelect = 'rows' || $typeSelect = 'blocks') {
				$stagger = 'data-stagger=' . $option['stagger_from'];
			} else {
				$stagger = '';
			}

			if ($typeSelect = 'blocks') {
				$blocksAnimation = 'data-blocks-animation=' . $option['blocks_aimation'];
				$ovClass = 'pl__blocks-' . $option['blocks_aimation'];
			} else {
				$blocksAnimation = '';
				$ovClass = '';
			}

			$curved = $option['loader_curved'] ? 'pl__curved' : '';
			$duration = $option['loader_duration'];
			$elements = $option['loader_elements'];
			$simpleFade = $option['fade_simple'] ? 'pl__fade-simple' : '';

			?>
				<div <?php echo esc_attr($stagger) . ' ' . esc_attr($blocksAnimation); ?>
					data-type="<?php echo esc_attr($option['loader_type']) ?>"
					data-direction="<?php echo esc_attr($option['loader_direction']) ?>"
					data-duration="<?php echo esc_attr($duration) ?>"
					class="pe--page--loader <?php echo esc_attr($type . ' ' . $direction . ' ' . $curved . ' ' . $simpleFade) ?>">

					<span class="page--loader--ov <?php echo esc_attr($ovClass) ?>">

						<?php
						if ($option['loader_type'] === 'columns') {

							$grid = $option['loader__columns__number'];

							for ($i = 0; $i < $grid; $i++) {
								echo '<span class="page--loader--column"  style="--index: ' . $i . '; --grid:' . $grid . '"></span>';
							}
						}

						if ($option['loader_type'] === 'rows') {

							$grid = $option['loader__rows__number'];

							for ($i = 0; $i < $grid; $i++) {
								echo '<span class="page--loader--row"  style="--index: ' . $i . '; --grid:' . $grid . '"></span>';
							}
						}
						if ($option['loader_type'] === 'blocks') {

							$blocksRows = $option['loader__blocks__rows'];
							$blocksColumns = $option['loader__blocks__columns'];

							$grid = $blocksColumns * $blocksRows;
							for ($i = 0; $i < $grid; $i++) {
								echo '<span class="page--loader--block"  style="--index: ' . $i . '; --grid:' . $grid . '"></span>';
							}
						}
						?>
					</span>

					<?php if (in_array('caption', $elements)) {

						$caption_style = $option['caption_style'];

						$vAlign = 'v-align-' . $option['caption_v_align'];
						$hAlign = 'h-align-' . $option['caption_h_align'];

						if ($caption_style === 'simple') {

							$animation = $option['caption_animation'];
							echo '<div class="page--loader--caption capt--' . $animation . ' capt--' . $caption_style . ' pl--item ' . $vAlign . ' ' . $hAlign . ' ">';

							if ($animation === 'fade' || $animation === 'progress') {
								echo '<span>' . $option['loader_caption'] . '</span>';
							} else {
								echo esc_html($option['loader_caption']);
							}

							if ($animation === 'progress') {
								echo '<span class="capt--clone">' . $option['loader_caption'] . '</span>';
							}

							echo '</div>';
						} else if ($caption_style === 'marquee') {
							echo '<div class="page--loader--caption capt--' . $caption_style . ' pl--item ' . $vAlign . ' ' . $hAlign . ' ">'; ?>

								<div class="pb--marquee no-button">
									<div class="pt--element--wrap">
										<div class="pb--marquee--wrap right-to-left" aria-hidden="true">
											<div class="pb--marquee__inner">
												<span><?php echo esc_html($option['loader_caption']) ?><i aria-hidden="true"
														class="material-icons md-fiber_manual_record" LOADING, PLEASE WAIT.
														data-md-icon="fiber_manual_record"></i></span>
												<span><?php echo esc_html($option['loader_caption']) ?><i aria-hidden="true"
														class="material-icons md-fiber_manual_record"
														data-md-icon="fiber_manual_record"></i></span>
												<span><?php echo esc_html($option['loader_caption']) ?><i aria-hidden="true"
														class="material-icons md-fiber_manual_record"
														data-md-icon="fiber_manual_record"></i></span>
												<span><?php echo esc_html($option['loader_caption']) ?><i aria-hidden="true"
														class="material-icons md-fiber_manual_record"
														data-md-icon="fiber_manual_record"></i></span>
											</div>
										</div>

									</div>
								</div>

							<?php echo '</div>';


						} else if ($caption_style === 'repeater') {

							echo '<div class="page--loader--caption capt--' . $caption_style . ' pl--item ' . $vAlign . ' ' . $hAlign . ' ">
							<div class="cation--repeater--wrap"><div class="capt--repeater--inner">';

							$texts = explode(',', $option['repeater_captions']);

							foreach ($texts as $text) {
								echo '<span class="caption--repeater--text">' . $text . '</span>';

							}
							echo '<span class="caption--repeater--text">' . $texts[0] . '</span>';
							?>

							<?php echo '</div></div></div>';
						}

					}
					if (in_array('counter', $elements)) {

						$vAlign = 'v-align-' . $option['counter_v_align'];
						$hAlign = 'h-align-' . $option['counter_h_align'];
						?>

						<div class="page--loader--count pl--item <?php echo esc_attr($vAlign . ' ' . $hAlign) ?>">

							<div class="numbers--wrap">
								<span class="number number__1">
									<span>0</span>
									<span>1</span>
								</span>
								<span class="number number__2">
									<span>0</span>
									<span>1</span>
									<span>2</span>
									<span>3</span>
									<span>4</span>
									<span>5</span>
									<span>6</span>
									<span>7</span>
									<span>8</span>
									<span>9</span>
									<span>0</span>
								</span>
								<span class="number number__3">
									<span>0</span>
									<span>1</span>
									<span>2</span>
									<span>3</span>
									<span>4</span>
									<span>5</span>
									<span>6</span>
									<span>7</span>
									<span>8</span>
									<span>9</span>
									<span>0</span>
								</span>
							</div>
						</div>

					<?php } ?>
					<?php if (in_array('logo', $elements)) {

						$vAlign = 'v-align-' . $option['logo_v_align'];
						$hAlign = 'h-align-' . $option['logo_h_align'];
						?>

						<div class="page--loader--logo pl--item <?php echo esc_attr($vAlign . ' ' . $hAlign) ?>">

							<img class="op" src="<?php echo esc_url($option['loader_logo']['url']) ?>">
							<img class="no--op" src="<?php echo esc_url($option['loader_logo']['url']) ?>">

						</div>

					<?php }
					?>
					<?php if (in_array('progressbar', $elements)) { ?>

						<div class="page--loader--progress pl--item">

							<span class="plp--line"></span>

							<?php if ($option['show_perc']) {
								echo '<span class="plp--perc">000</span>';
							} ?>

						</div>

					<?php }
					?>


				</div>
				<?php
		}
	}
}

function saren_page_transitions()
{
	if (class_exists("Redux")) {
		$option = get_option('pe-redux');

		if ($option['page_transitions']) {

			$typeSelect = $option['transition_type'];
			$type = 'pt__' . $option['transition_type'];

			if ($typeSelect === 'fade') {
				$direction = 'pt__' . $option['transitions_fade_direction'];
			} else if ($typeSelect === 'rows') {
				$direction = 'pt__' . $option['transitions_rows_direction'];
			} else if ($typeSelect === 'columns') {
				$direction = 'pt__' . $option['transitions_columns_direction'];
			} else if ($typeSelect === 'blocks') {
				$direction = 'pt__';
			} else {
				$direction = 'pt__' . $option['transition_direction'];
			}

			if ($typeSelect === 'columns' || $typeSelect === 'rows' || $typeSelect === 'blocks') {
				$stagger = 'data-stagger=' . $option['transitions_stagger_from'];
			} else {
				$stagger = '';
			}

			if ($typeSelect === 'blocks') {
				$blocksAnimation = 'data-blocks-animation=' . $option['transitions_blocks_aimation'];
				$ovClass = 'pt__blocks-' . $option['transitions_blocks_aimation'];
			} else {
				$blocksAnimation = '';
				$ovClass = '';
			}

			$simpleFade = $option['transitions_fade_simple'] ? 'pt__fade-simple' : '';

			$type = 'pt__' . $option['transition_type'];
			$curved = $option['transitions_curved'] ? 'pt__curved' : '';
			$elements = $option['transition_elements'];
			$captionType = $option['caption_type'];

			?>

				<div <?php echo esc_attr($stagger) . ' ' . esc_attr($blocksAnimation); ?>
					data-type="<?php echo esc_attr($option['transition_type']) ?>"
					data-direction="<?php echo esc_attr($option['transition_direction']) ?>"
					class="page--transitions <?php echo esc_attr($type . ' ' . $direction . ' ' . $curved . ' ' . $simpleFade) ?>">

					<div class="pt--wrapper <?php echo esc_attr($ovClass) ?>">

						<?php
						if ($typeSelect === 'columns') {

							$grid = $option['transitions__columns__number'];

							for ($i = 0; $i < $grid; $i++) {
								echo '<span class="page--transition--column"  style="--index: ' . $i . '; --grid:' . $grid . '"></span>';
							}
						} else if ($typeSelect === 'rows') {

							$grid = $option['transitions__rows__number'];

							for ($i = 0; $i < $grid; $i++) {
								echo '<span class="page--transition--row"  style="--index: ' . $i . '; --grid:' . $grid . '"></span>';
							}
						} else if ($typeSelect === 'blocks') {

							$blocksRows = $option['transitions__blocks__rows'];
							$blocksColumns = $option['transitions__blocks__columns'];

							$grid = $blocksColumns * $blocksRows;
							for ($i = 0; $i < $grid; $i++) {
								echo '<span class="page--transition--block"  style="--index: ' . $i . '; --grid:' . $grid . '"></span>';
							}
						} else {
							?>
									<span class="slide--op"></span>
									<span class="pt--overlay"></span>
						<?php } ?>

						<?php if (in_array('logo', $elements)) {
							$vAlign = 'v-align-' . $option['trans_logo_v_align'];
							$hAlign = 'h-align-' . $option['trans_logo_h_align'];

							?>

							<div class="pt--element <?php echo esc_attr($vAlign . ' ' . $hAlign . ' pt--logo') ?>">
								<div class="pt--element--wrap">
									<img src="<?php echo esc_url($option['transition_logo']['url']) ?>">
								</div>

							</div>
						<?php }

						if (in_array('caption', $elements)) {

							$vAlign = 'v-align-' . $option['trans_caption_v_align'];
							$hAlign = 'h-align-' . $option['trans_caption_h_align'];
							$animation = $option['transition_caption_animation'];
							$caption_style = $captionType;
							?>

							<div class="pt--element <?php echo esc_attr($vAlign . ' ' . $hAlign) ?>">
								<?php if ($caption_style === 'simple') {

									echo '<div class="page--transition--caption capt--' . $animation . ' capt--' . $caption_style . '">';

									if ($animation === 'fade' || $animation === 'progress') {
										echo '<span class="not-clone">' . esc_html($option['transition_caption']) . '</span>';
									} else {
										echo esc_html($option['transition_caption']);
									}

									if ($animation === 'progress') {
										echo '<span class="capt--clone">' . esc_html($option['transition_caption']) . '</span>';
									}
									;
									echo '</div>';
								} else if ($captionType === 'marquee') {
									echo '<div class="page--transition--caption capt--' . $caption_style . '">';
									?>

										<div class="pb--marquee no-button">
											<div class="pt--element--wrap">
												<div class="pb--marquee--wrap right-to-left" aria-hidden="true">
													<div class="pb--marquee__inner">
														<span><?php echo esc_html($option['transition_caption']) ?><i aria-hidden="true"
																class="material-icons md-fiber_manual_record" LOADING, PLEASE WAIT.
																data-md-icon="fiber_manual_record"></i></span>
														<span><?php echo esc_html($option['transition_caption']) ?><i aria-hidden="true"
																class="material-icons md-fiber_manual_record"
																data-md-icon="fiber_manual_record"></i></span>
														<span><?php echo esc_html($option['transition_caption']) ?><i aria-hidden="true"
																class="material-icons md-fiber_manual_record"
																data-md-icon="fiber_manual_record"></i></span>
														<span><?php echo esc_html($option['transition_caption']) ?><i aria-hidden="true"
																class="material-icons md-fiber_manual_record"
																data-md-icon="fiber_manual_record"></i></span>
													</div>
												</div>

											</div>
										</div>

									<?php echo '</div>';
								} else if ($caption_style === 'repeater') {

									echo '<div class="page--transition--caption capt--' . $caption_style . '">
								<div class="cation--repeater--wrap"><div class="capt--repeater--inner">';

									$texts = explode(',', $option['transition_repeater_captions']);

									foreach ($texts as $text) {
										echo '<span class="caption--repeater--text">' . $text . '</span>';
									}
									echo '<span class="caption--repeater--text">' . $texts[0] . '</span>';
									?>

									<?php echo '</div></div></div>';
								} ?>
							</div>
						<?php } ?>

					</div>

				</div>

				<?php
		}
	}
}
