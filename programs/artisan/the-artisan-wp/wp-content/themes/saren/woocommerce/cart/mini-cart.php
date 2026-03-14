<?php
/**
 * Mini-cart
 *
 * Contains the markup for the mini-cart, used by the cart widget.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/mini-cart.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version  9.4.0
 */
defined('ABSPATH') || exit;

do_action('woocommerce_before_mini_cart'); ?>

<?php if (function_exists('WC') && WC()->cart && !WC()->cart->is_empty()): ?>
	<div class="saren--mini--cart--head">
		<div class="woocommerce-mini-cart-heading">

			<h4><?php echo esc_html_e('CART', 'woocommerce'); ?></h4>
			<h4 class="cart--count"><?php echo WC()->cart->cart_contents_count; ?></h4>

		</div>

		<ul data-lenis-prevent class="woocommerce-mini-cart cart_list product_list_widget <?php echo esc_attr($args['list_class']); ?>">
			<?php
			do_action('woocommerce_before_mini_cart_contents');

			foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {

				$_product = apply_filters('woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key);
				$product_id = apply_filters('woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key);

				if ($_product && $_product->exists() && $cart_item['quantity'] > 0 && apply_filters('woocommerce_widget_cart_item_visible', true, $cart_item, $cart_item_key)) {
					/**
					 * This filter is documented in woocommerce/templates/cart/cart.php.
					 *
					 * @since 2.1.0
					 */
					$product_name = apply_filters('woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key);
					$thumbnail = apply_filters('woocommerce_cart_item_thumbnail', $_product->get_image(), $cart_item, $cart_item_key);
					$product_price = apply_filters('woocommerce_cart_item_price', WC()->cart->get_product_price($_product), $cart_item, $cart_item_key);
					$product_permalink = apply_filters('woocommerce_cart_item_permalink', $_product->is_visible() ? $_product->get_permalink($cart_item) : '', $cart_item, $cart_item_key);
					?>
					<li
						class="woocommerce-mini-cart-item <?php echo esc_attr(apply_filters('woocommerce_mini_cart_item_class', 'mini_cart_item', $cart_item, $cart_item_key)); ?>">


						<div class="mini-cart-item-image">
							<?php
							if (empty($product_permalink)): ?>
								<?php echo do_shortcode($thumbnail); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<?php else: ?>
								<a href="<?php echo esc_url($product_permalink); ?>">
									<?php echo do_shortcode($thumbnail); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								</a>
							<?php endif; ?>
						</div>

						<div class="mini-cart-item-detail">

							<div class="mini-cart-item-det-top">

								<a class="mini--cart--item--title" href="<?php echo esc_url($product_permalink); ?>">
									<?php echo wp_kses_post($product_name); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								</a>
								<?php
								$svgPath = get_template_directory() . '/assets/img/remove.svg';
								$icon = file_get_contents($svgPath);
								echo apply_filters( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
									'woocommerce_cart_item_remove_link',
									sprintf(
										'<a href="%s" data-barba-prevent="all" class="remove remove_from_cart_button" aria-label="%s" data-product_id="%s" data-cart_item_key="%s" data-product_sku="%s">' . $icon . '</a>',
										esc_url(wc_get_cart_remove_url($cart_item_key)),
										/* translators: %s is the product name */
										esc_attr(sprintf(__('Remove %s from cart', 'woocommerce'), wp_strip_all_tags($product_name))),
										esc_attr($product_id),
										esc_attr($cart_item_key),
										esc_attr($_product->get_sku())
									),
									$cart_item_key
								);
								?>

								<?php echo wc_get_formatted_cart_item_data($cart_item); 

if (isset($cart_item['extra_options'])) {
	echo '<div class="cart--item--extra--options">';
	foreach ($cart_item['extra_options'] as $option) {
		echo '<div class="cart--item--extra">';
		echo esc_html($option['label']);
		echo ' +' . wc_price($option['price']);
		echo '</div>';
	}
	echo '</div>';
}

								?>


							</div>

							<div class="mini-cart-item-det-bott">



								<?php echo apply_filters(
									'woocommerce_widget_cart_item_quantity',
									'<div class="quantity-wrapper">
        <input type="number" class="mini-cart-qty input-text qty" data-cart_item_key="' . esc_attr($cart_item_key) . '" value="' . esc_attr($cart_item['quantity']) . '" min="1" />

    </div>',
									$cart_item,
									$cart_item_key
								);
								?>

								<div class="saren--quantity--control">
									<span class="quantity--decrease"><svg xmlns="http://www.w3.org/2000/svg" height="1em"
											viewBox="0 -960 960 960" width="1em" fill="var(--mainColor)">
											<path d="M232-444v-72h496v72H232Z" />
										</svg></span>
									<span class="current--quantity"><?php echo esc_html($cart_item['quantity']); ?></span>
									<span class="quantity--increase"><svg xmlns="http://www.w3.org/2000/svg" height="1em"
											viewBox="0 -960 960 960" width="1em" fill="var(--mainColor)">
											<path d="M444-444H240v-72h204v-204h72v204h204v72H516v204h-72v-204Z" />
										</svg></span>
								</div>


								<?php echo apply_filters('woocommerce_widget_cart_item_quantity', '<span class="quantity">' . sprintf('%s &times; %s', $cart_item['quantity'], $product_price) . '</span>', $cart_item, $cart_item_key); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>


							</div>


						</div>




					</li>

					<?php
				}
			}

			do_action('woocommerce_mini_cart_contents');
			?>
		</ul>
	</div>
	<div class="saren--mini--cart--foot">
		<p class="woocommerce-mini-cart__total total">
			<?php
			/**
			 * Hook: woocommerce_widget_shopping_cart_total.
			 *
			 * @hooked woocommerce_widget_shopping_cart_subtotal - 10
			 */
			do_action('woocommerce_widget_shopping_cart_total');
			?>
		</p>

		<?php do_action('woocommerce_widget_shopping_cart_before_buttons'); ?>


		<p class="woocommerce-mini-cart__buttons buttons">
			<?php do_action('woocommerce_widget_shopping_cart_buttons'); ?>
		</p>

		<?php do_action('woocommerce_widget_shopping_cart_after_buttons'); ?>


	</div>


<?php else:
	$svgPath = get_template_directory() . '/assets/img/box_open.svg';
	$emptyIcon = file_get_contents($svgPath);
	?>

	<div class="saren--emtpy--cart--not">

		<?php echo do_shortcode($emptyIcon) ?>

		<p class="woocommerce-mini-cart__empty-message"><?php esc_html_e('No products in the cart.', 'woocommerce'); ?></p>

	</div>




<?php endif; ?>

<?php do_action('woocommerce_after_mini_cart'); ?>