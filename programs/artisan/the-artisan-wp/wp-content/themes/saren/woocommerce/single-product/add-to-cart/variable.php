<?php
/**
 * Variable product add to cart
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/add-to-cart/variable.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 9.6.0
 */

defined('ABSPATH') || exit;

global $product;

if (!$product && isset($_REQUEST['product_id'])) {

	$product_id = intval($_REQUEST['product_id']);

	if ($product_id > 0) {
		$product = wc_get_product($product_id);

		if (!$product) {
			echo '<p>Error: Product not found.</p>';
			return;
		}
	} else {
		echo '<p>Error: Invalid product ID.</p>';
		return;
	}
}

$fileUploads = get_post_meta($product->get_id(), '_enable_file_uploads', true);

$attribute_keys = array_keys($attributes);
$variations_json = wp_json_encode($available_variations);
$variations_attr = function_exists('wc_esc_json') ? wc_esc_json($variations_json) : _wp_specialchars($variations_json, ENT_QUOTES, 'UTF-8', true);

do_action('woocommerce_before_add_to_cart_form'); ?>

<form class="variations_form cart"
	action="<?php echo esc_url(apply_filters('woocommerce_add_to_cart_form_action', $product->get_permalink())); ?>"
	method="post" enctype='multipart/form-data' data-product_id="<?php echo absint($product->get_id()); ?>"
	data-product_variations="<?php echo esc_attr($variations_attr); ?>">
	<?php do_action('woocommerce_before_variations_form'); ?>

	<?php if (empty($available_variations) && false !== $available_variations) { ?>
		<p class="stock out-of-stock">
			<?php echo esc_html(apply_filters('woocommerce_out_of_stock_message', __('This product is currently out of stock and unavailable.', 'woocommerce'))); ?>
		</p>
	<?php } else { ?>
		<table class="variations" cellspacing="0">
			<tbody>
				<?php $variations = $product->get_available_variations();	?>

				<!-- Configurator  -->
				<div class="saren--variations--configurator">
					<div class="sv--configurator--titles">
						<?php
						$key = -1;
						foreach ($attributes as $attribute_name => $options) {
							$key++;
							?>
							<div data-index="<?php echo esc_attr($key) ?>"
								class="svc--title svc--disabled <?php echo esc_attr('svc--title--' . sanitize_title($attribute_name)); ?>"
								data-attr="<?php echo esc_attr(sanitize_title($attribute_name)) ?>">
								<h6><?php echo wc_attribute_label($attribute_name); ?></h6>
							</div>
						<?php }
						?>
					</div>
				</div>
				<!-- Configurator  -->

				<?php
				$key = -1;
				foreach ($attributes as $attribute_name => $options):
					$term_id = wc_attribute_taxonomy_id_by_name($attribute_name);
					$display_type = get_option("wc_attribute_display_type-$term_id", 'default');
					$key++;
					?>
					<tr data-index="<?php echo esc_attr($key) ?>"
						class="<?php echo esc_attr($display_type . ' ' . 'attr_' . sanitize_title($attribute_name)); ?>"
						data-attr="<?php echo esc_attr(sanitize_title($attribute_name)); ?>">
						<th class="label"><label
								for="<?php echo esc_attr(sanitize_title($attribute_name)); ?>"><?php echo wc_attribute_label($attribute_name); // WPCS: XSS ok. ?></label>

							<?php $attr_desc = $term_id ? get_option("wc_attribute_attribute_desctiption-$term_id") : '';
							if ($attr_desc) {
								echo '<span class="saren--attr--desc">' . $attr_desc . '</span>';
							}
							?>
						</th>
						<td class="value">
							<?php
							saren_wc_radio_variation_attribute_options(
								array(
									'options' => $options,
									'attribute' => $attribute_name,
									'product' => $product,
								)
							);

							wc_dropdown_variation_attribute_options(
								array(
									'options' => $options,
									'attribute' => $attribute_name,
									'product' => $product,
								)
							);

							?>
						</td>
					</tr>
				<?php endforeach; ?>
				<?php if ($fileUploads === 'yes') { ?>
					<tr>
						<th></th>
						<td class="value">
							<?php echo saren_file_upload_form(); ?>
						</td>
					</tr>
				<?php } ?>



			</tbody>

		</table>

		<?php echo end($attribute_keys) === $attribute_name ? wp_kses_post(apply_filters('woocommerce_reset_variations_link', '<a class="reset_variations" href="#">CLEAR</a>')) : ''; ?>

		<?php do_action('woocommerce_after_variations_table'); ?>

		<div class="svc--buttons">

			<?php
			$key = -1;
			foreach ($attributes as $attribute_name => $options) {
				$key++;
				if ($key !== 0) {
					?>
					<div data-index="<?php echo esc_attr($key) ?>"
						class="svc--button pe--styled--object svc--disabled svc--button--<?php echo esc_attr($key) ?> svc--button_<?php echo esc_attr(sanitize_title($attribute_name)) ?>"
						data-attr="<?php echo esc_attr(sanitize_title($attribute_name)) ?>">
						<?php echo esc_html('Continue to - ', 'saren') . wc_attribute_label($attribute_name); ?>

						<span class="svc--icon">
							<?php echo file_get_contents(get_template_directory(). '/assets/img/arrow_forward.svg'); ?>
						</span>
					</div>
				<?php }
			}
			?>
		</div>

		<?php extraOptionsProductRender($product->get_id()) ?>

		<div class="single_variation_wrap">
			<?php
			/**
			 * Hook: woocommerce_before_single_variation.
			 */
			do_action('woocommerce_before_single_variation');

			/**
			 * Hook: woocommerce_single_variation. Used to output the cart button and placeholder for variation data.
			 *
			 * @since 2.4.0
			 * @hooked woocommerce_single_variation - 10 Empty div for variation data.
			 * @hooked woocommerce_single_variation_add_to_cart_button - 20 Qty and cart button.
			 */
			do_action('woocommerce_single_variation');

			/**
			 * Hook: woocommerce_after_single_variation.
			 */
			do_action('woocommerce_after_single_variation');
			?>
		</div>
	<?php }
	; ?>

	<?php do_action('woocommerce_after_variations_form'); ?>
</form>

<?php
do_action('woocommerce_after_add_to_cart_form');
