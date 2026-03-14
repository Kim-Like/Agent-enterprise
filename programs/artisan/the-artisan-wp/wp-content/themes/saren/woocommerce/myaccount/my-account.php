<?php
/**
 * My Account page
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/myaccount/my-account.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.5.0
 */

defined('ABSPATH') || exit;

/**
 * My Account navigation.
 *
 * @since 2.6.0
 */
?>



<div class="section account--sec" data-barba-prevent="all">

	<div class="pe-wrapper">

		<div class="pe-col-3 saren--account--nav">

			<div class="saren--account--details">

				<?php
				$current_user_id = get_current_user_id();
				$user_info = get_userdata($current_user_id);
				$first_name = get_user_meta($current_user_id, 'first_name', true);
				$last_name = get_user_meta($current_user_id, 'last_name', true);
				$user_email = $user_info->user_email;
				$display_name = $user_info->display_name;
				$bio = get_user_meta($current_user_id, 'description', true);
				$user_avatar = get_avatar_url($current_user_id);
				$user_website = $user_info->user_url;
				?>

				<div class="saren--user--avatar">
					<img src="<?php echo esc_url($user_avatar) ?>">
				</div>

				<div class="saren--user--details">

					<div class="saren--user--display--name">
						<?php echo esc_html($display_name); ?>
					</div>

					<?php if ($bio) { ?>
						<div class="saren--user--bio">
							<?php echo esc_html($bio); ?>
						</div>
					<?php } ?>

					<?php if ($user_website) { ?>
						<div class="saren--user--url">
							<?php echo '<a target="_blank" href="' . $user_website . '">' . $user_website . '</a>'; ?>
						</div>
					<?php } ?>

					<?php
					$logout_url = wp_logout_url(home_url());

					echo '<a data-barba-prevent="all" class="saren--logout--button" href="' . esc_url($logout_url) . '" class="custom-logout-button">Logout</a>';
					?>

				</div>

			</div>

			<?php do_action('woocommerce_account_navigation'); ?>

			<div class="saren--account--dets--foot">


			</div>

			<div class="saren--user--active--order">

				<?php
				$orders = wc_get_orders(array(
					'customer' => $current_user_id,
					'limit' => 1,
					'orderby' => 'date',
					'order' => 'DESC',
					'status' => array('processing', 'on-hold', 'pending'),
				));

				if (!empty($orders)) {

					foreach ($orders as $order) {

						$order_id = $order->get_id();
						$order_date = $order->get_date_created()->date('Y-m-d H:i');
						$order_total = $order->get_formatted_order_total();
						$order_status = wc_get_order_status_name($order->get_status());

						echo '<p>' . esc_html('Active Order', 'saren') . '<span>#' . esc_html($order_id) . '</span>
						<span>' . esc_html($order_date) . '</span>' . '</p>';
						?>

						<div>
							<a href="<?php echo esc_url($order->get_view_order_url()) ?>">
								<div class="saren--latest--products--item">
									<div class="lpi--row lpi--images">
										<?php
										foreach ($order->get_items() as $item) {
											$product = $item->get_product();
											if ($product) {
												$thumbnail_url = $product->get_image('thumbnail');
												echo "<div>$thumbnail_url</div>";
											}
										}
										?>
									</div>
									<span class="lpi--row"><?php echo _e($order_total) ?></span>
									<span class="lpi--row order--status"><?php echo esc_html($order_status) ?></span>
								</div>
							</a>
						</div>
					<?php }
					echo "</ul>";
				} else {
					echo "<p>" . esc_html('No active orders.', 'saren') . "</p>";
				}
				?>


			</div>


		</div>

		<div class="pe-col-9 saren--account--content">

			<div class="saren--account--nav--top">
				<?php do_action('woocommerce_account_navigation'); ?>
			</div>

			<div class="woocommerce-MyAccount-content" data-barba-prevent="all">
				<?php
				/**
				 * My Account content.
				 *
				 * @since 2.6.0
				 */
				do_action('woocommerce_account_content');
				?>
			</div>

		</div>




	</div>
</div>