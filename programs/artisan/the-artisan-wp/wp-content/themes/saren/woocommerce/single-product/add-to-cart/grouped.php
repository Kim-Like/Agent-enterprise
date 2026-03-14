<?php
/**
 * Grouped product add to cart
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/add-to-cart/grouped.php.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 9.8.0
 */

defined('ABSPATH') || exit;

global $product, $post;

do_action('woocommerce_before_add_to_cart_form'); ?>

<form class="cart grouped_form" id="grouped_add_to_cart_form"
	action="<?php echo esc_url(apply_filters('woocommerce_add_to_cart_form_action', $product->get_permalink())); ?>"
	method="post" enctype='multipart/form-data'>
	<div class="woocommerce-grouped-product-list">
		<?php
		$quantites_required = false;
		$previous_post = $post;
		$grouped_product_columns = apply_filters(
			'woocommerce_grouped_product_columns',
			array(
				'quantity',
				'label',
				'price',
			),
			$product
		);

		foreach ($grouped_products as $grouped_product_child) {
			$post_object = get_post($grouped_product_child->get_id());
			$quantites_required = $quantites_required || ($grouped_product_child->is_purchasable() && !$grouped_product_child->has_options());
			$post = $post_object; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			setup_postdata($post);

			if ($grouped_product_child->is_in_stock()) {
				echo '<div id="product-' . esc_attr($grouped_product_child->get_id()) . '" class="woocommerce-grouped-product-list-item ' . esc_attr(implode(' ', wc_get_product_class('', $grouped_product_child))) . '">'; ?>

				<div class="woocommerce-grouped-product-list-item__image">

					<?php
					echo $grouped_product_child->is_visible()
						? '<a href="' . esc_url($grouped_product_child->get_permalink()) . '">' . $grouped_product_child->get_image('thumbnail') . '</a>'
						: $grouped_product_child->get_image('thumbnail'); ?>

				</div>

				<div class="woocommerce-grouped-product-list-item__details">

					<div class="woocommerce-grouped-product-list-item__details__top">

						<div class="woocommerce-grouped-product-list-item__name">
							<?php echo $grouped_product_child->get_name() ?>
						</div>

						<div class="woocommerce-grouped-product-list-item__price">
							<?php echo $grouped_product_child->get_price_html() . wc_get_stock_html($grouped_product_child); ?>
						</div>

					</div>

					<div class="woocommerce-grouped-product-list-item__details__bottom">

						<?php if ($grouped_product_child->is_type('variable')) {
							$available_variations = $grouped_product_child->get_available_variations();
							$attributes = $grouped_product_child->get_variation_attributes();

							echo '<div class="woocommerce-grouped-product-list-item__variations">';
							foreach ($attributes as $attribute_name => $options) {
								echo '<div class="woocommerce-grouped-product-list-item__variation">';
								echo '<label>' . wc_attribute_label($attribute_name) . '</label>';
								echo '<select name="attribute_' . esc_attr($attribute_name) . '">';
								echo '<option value="">' . esc_html__('Choose an option', 'woocommerce') . '</option>';
								foreach ($options as $option) {
									echo '<option value="' . esc_attr($option) . '">' . esc_html($option) . '</option>';
								}
								echo '</select>';
								echo '</div>';
							}
							echo '</div>';
						} ?>

						<?php
						do_action('woocommerce_before_add_to_cart_quantity');

						woocommerce_quantity_input(
							array(
								'min_value' => apply_filters('woocommerce_quantity_input_min', $product->get_min_purchase_quantity(), $product),
								'max_value' => apply_filters('woocommerce_quantity_input_max', $product->get_max_purchase_quantity(), $product),
								'input_value' => isset($_POST['quantity']) ? wc_stock_amount(wp_unslash($_POST['quantity'])) : $product->get_min_purchase_quantity(), // WPCS: CSRF ok, input var ok.
							)
						);
						?>

						<div class="saren--quantity--control">
							<span class="quantity--decrease"><svg xmlns="http://www.w3.org/2000/svg" height="1em"
									viewBox="0 -960 960 960" width="1em">
									<path d="M232-444v-72h496v72H232Z" />
								</svg></span>
							<span
								class="current--quantity"><?php echo isset($_POST['quantity']) ? wc_stock_amount(wp_unslash($_POST['quantity'])) : $product->get_min_purchase_quantity(); ?></span>
							<span class="quantity--increase"><svg xmlns="http://www.w3.org/2000/svg" height="1em"
									viewBox="0 -960 960 960" width="1em">
									<path d="M444-444H240v-72h204v-204h72v204h204v72H516v204h-72v-204Z" />
								</svg>
							</span>
						</div>

						<?php
						do_action('woocommerce_after_add_to_cart_quantity');


						?>

					</div>
				</div>

			</div>
			<?php
			}
		}
		$post = $previous_post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata($post);
		?>
	</div>

	<div class="saren--cart--form">

		<button type="submit" name="add-to-cart"
			class="single_add_to_cart_button grouped_add_to_cart_button button alt<?php echo esc_attr(wc_wp_theme_get_element_class_name('button') ? ' ' . wc_wp_theme_get_element_class_name('button') : ''); ?>"><?php echo '<span class="single--add--text">' . esc_html($product->single_add_to_cart_text()) . '</span>'; ?>
			<svg class="cart-plus" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
				<path class="cart-plus" d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
			</svg>
			<svg class="cart-loading" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960"
				width="1em">
				<path
					d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z" />
			</svg>
			<svg class="cart-done" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em">
				<path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
			</svg>
			<span class="card-add-icon">
				<?php
				$svgPath = get_template_directory() . '/assets/img/cart-add.svg';
				$icon = file_get_contents($svgPath);
				echo $icon;
				?>
			</span>

		</button>

	</div>

</form>


<?php do_action('woocommerce_after_add_to_cart_form'); ?>