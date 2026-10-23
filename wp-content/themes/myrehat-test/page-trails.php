<?php
/**
 * Template Name: Trails Test Page
 *
 * Front page listing + booking form.
 */

get_header();

/* -------------------------------------------------------------------------
 * A12 — read the one-time booking token created by the handler
 * ---------------------------------------------------------------------- */
$booking_token = isset( $_GET['booking'] ) ? sanitize_text_field( wp_unslash( $_GET['booking'] ) ) : '';
$booking       = null;
$booking_error = '';

if ( '' !== $booking_token ) {
	if ( 'invalid' === $booking_token ) {
		$booking_error = __( 'We could not verify your booking request. Please check the required fields and try again.', 'myrehat-test' );
	} else {
		$booking = get_transient( 'myrehat_booking_' . $booking_token );
		if ( ! $booking ) {
			$booking_error = __( 'This confirmation link has expired. Please submit the form again.', 'myrehat-test' );
		}
	}
}
?>
<div class="trails-page">

	<?php
	// A5 — hero title is now exactly "Tropic Hiking Trails" (Elementor section when imported).
	echo myrehat_test_hero_html(); // phpcs:ignore WordPress.Security.EscapeOutput -- trusted theme template.
	?>

	<section class="trails-promo" aria-label="<?php esc_attr_e( 'Promotion', 'myrehat-test' ); ?>">
		<strong><?php esc_html_e( 'Limited offer:', 'myrehat-test' ); ?></strong>
		<?php esc_html_e( '20% off all guided hikes this month.', 'myrehat-test' ); ?>
	</section>

	<main class="trails-main">

		<!-- A1 + A2 — search and category filter drive the same listing -->
		<div class="trails-search-row">
			<label class="screen-reader-text" for="search-box"><?php esc_html_e( 'Search trails', 'myrehat-test' ); ?></label>
			<input id="search-box" type="search" placeholder="<?php esc_attr_e( 'Search trails...', 'myrehat-test' ); ?>" autocomplete="off">
			<label class="screen-reader-text" for="category"><?php esc_html_e( 'Filter by category', 'myrehat-test' ); ?></label>
			<select id="category">
				<option value="all"><?php esc_html_e( 'All categories', 'myrehat-test' ); ?></option>
				<option value="mountain"><?php esc_html_e( 'Mountain', 'myrehat-test' ); ?></option>
				<option value="beach"><?php esc_html_e( 'Beach', 'myrehat-test' ); ?></option>
				<option value="forest"><?php esc_html_e( 'Forest', 'myrehat-test' ); ?></option>
			</select>
		</div>

		<p id="trails-no-results" hidden><?php esc_html_e( 'No trails found.', 'myrehat-test' ); ?></p>

		<div class="trails-cards" id="trails-list">
			<article class="trail-card" data-category="mountain">
				<h3>Mount Rinjani Sunrise</h3>
				<p>2-day guided summit trek, Lombok.</p>
				<span class="price">RM 350 / pax</span>
			</article>
			<article class="trail-card" data-category="beach">
				<h3>Pulau Perhentian Coastal Walk</h3>
				<p>Easy coastal trail, Terengganu.</p>
				<span class="price">RM 120 / pax</span>
			</article>
			<article class="trail-card" data-category="forest">
				<h3>Taman Negara Canopy Trail</h3>
				<p>Rainforest walk, Pahang.</p>
				<span class="price">RM 180 / pax</span>
			</article>
			<article class="trail-card" data-category="mountain">
				<h3>Mount Kinabalu Base Trek</h3>
				<p>Highland trek, Sabah.</p>
				<span class="price">RM 420 / pax</span>
			</article>
			<article class="trail-card" data-category="beach">
				<h3>Langkawi Sunset Ridge</h3>
				<p>Evening ridge walk, Kedah.</p>
				<span class="price">RM 95 / pax</span>
			</article>
			<article class="trail-card" data-category="forest">
				<h3>Belum Mossy Forest</h3>
				<p>Misty forest trail, Perak.</p>
				<span class="price">RM 150 / pax</span>
			</article>
		</div>

		<section class="trails-booking" id="booking">
			<h2><?php echo esc_html( myrehat_test_booking_title() ); ?></h2>

			<form
				id="booking-form"
				class="trails-booking-form"
				action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"
				method="post"
				data-daily="<?php echo esc_attr( MYREHAT_DAILY_RATE ); ?>"
				data-monthly-days="<?php echo esc_attr( MYREHAT_MONTHLY_DAYS ); ?>"
				data-monthly-discount="<?php echo esc_attr( MYREHAT_MONTHLY_DISCOUNT ); ?>"
			>
				<input type="hidden" name="action" value="myrehat_booking">
				<input type="hidden" name="trails_booking" value="1">
				<?php wp_nonce_field( 'myrehat_booking', 'myrehat_booking_nonce' ); ?>

				<label for="booking-name"><?php esc_html_e( 'Name', 'myrehat-test' ); ?>
					<input type="text" id="booking-name" name="name" required>
				</label>

				<label for="booking-email"><?php esc_html_e( 'Email', 'myrehat-test' ); ?>
					<input type="email" id="booking-email" name="email" required>
				</label>

				<label for="booking-date"><?php esc_html_e( 'Date', 'myrehat-test' ); ?>
					<input type="date" id="booking-date" name="date" required>
				</label>

				<!-- A11 — Daily / Monthly with live total -->
				<fieldset class="booking-plan">
					<legend><?php esc_html_e( 'Booking type', 'myrehat-test' ); ?></legend>
					<label>
						<input type="radio" name="plan" value="daily" checked>
						<?php esc_html_e( 'Daily — RM 350', 'myrehat-test' ); ?>
					</label>
					<label>
						<input type="radio" name="plan" value="monthly">
						<?php esc_html_e( 'Monthly — RM 8,400 (RM 350 × 30 × 0.8)', 'myrehat-test' ); ?>
					</label>
				</fieldset>

				<!-- A6 — Digital Nomad is required -->
				<fieldset class="booking-nomad">
					<legend><?php esc_html_e( 'Digital Nomad (required)', 'myrehat-test' ); ?></legend>
					<label><input type="radio" name="digital_nomad" value="yes" required> <?php esc_html_e( 'Yes', 'myrehat-test' ); ?></label>
					<label><input type="radio" name="digital_nomad" value="no" required> <?php esc_html_e( 'No', 'myrehat-test' ); ?></label>
				</fieldset>

				<p id="trails-total" aria-live="polite">
					<?php
					echo esc_html(
						sprintf(
							/* translators: %s: total price, e.g. RM 350 */
							__( 'Total: %s', 'myrehat-test' ),
							myrehat_test_format_rm( MYREHAT_DAILY_RATE )
						)
					);
					?>
				</p>

				<!-- A9 — Host Terms is required -->
				<label class="booking-terms">
					<input type="checkbox" name="host_terms" value="1" required>
					<?php esc_html_e( 'I agree to the Host Terms', 'myrehat-test' ); ?>
				</label>

				<button type="submit"><?php esc_html_e( 'Request booking', 'myrehat-test' ); ?></button>
			</form>

			<?php if ( $booking ) : ?>
				<!-- A12 — automatic confirmation after a successful booking -->
				<div id="trails-confirmation" class="trails-confirmation" role="status" tabindex="-1">
					<h3><?php esc_html_e( 'Booking received', 'myrehat-test' ); ?></h3>
					<p>
						<?php
						printf(
							/* translators: 1: customer name, 2: booking date */
							esc_html__( 'Thanks %1$s — your request for %2$s has been recorded.', 'myrehat-test' ),
							'<strong>' . esc_html( $booking['name'] ) . '</strong>',
							esc_html( $booking['date'] )
						);
						?>
					</p>
					<p>
						<?php
						printf(
							/* translators: 1: plan label, 2: total price, 3: digital nomad answer */
							esc_html__( 'Plan: %1$s · Total: %2$s · Digital Nomad: %3$s', 'myrehat-test' ),
							esc_html( 'monthly' === $booking['plan'] ? __( 'Monthly', 'myrehat-test' ) : __( 'Daily', 'myrehat-test' ) ),
							'<strong>' . esc_html( myrehat_test_format_rm( $booking['total'] ) ) . '</strong>',
							esc_html( $booking['digital_nomad'] )
						);
						?>
					</p>
					<p><?php echo esc_html( sprintf( /* translators: %s: customer email */ __( 'A copy of this request goes to %s. Our crew replies within 1 working day.', 'myrehat-test' ), $booking['email'] ) ); ?></p>
				</div>
			<?php elseif ( $booking_error ) : ?>
				<div class="trails-confirmation trails-confirmation-error" role="alert">
					<?php echo esc_html( $booking_error ); ?>
				</div>
			<?php endif; ?>
		</section>
	</main>

	<!-- A4 — only FAQ / Contact Us / PDPA / Privacy Policy remain -->
	<footer class="trails-footer">
		<nav class="trails-footer-nav" aria-label="<?php esc_attr_e( 'Footer', 'myrehat-test' ); ?>">
			<a href="#faq"><?php esc_html_e( 'FAQ', 'myrehat-test' ); ?></a>
			<a href="#contact"><?php esc_html_e( 'Contact Us', 'myrehat-test' ); ?></a>
			<a href="#pdpa"><?php esc_html_e( 'PDPA', 'myrehat-test' ); ?></a>
			<a href="#privacy-policy"><?php esc_html_e( 'Privacy Policy', 'myrehat-test' ); ?></a>
		</nav>

		<?php // A8 — Facebook, LinkedIn, Instagram, TikTok, YouTube. ?>
		<nav class="trails-footer-social" aria-label="<?php esc_attr_e( 'Social media', 'myrehat-test' ); ?>">
			<?php
			$myrehat_socials = array(
				'facebook'  => array( 'Facebook', 'https://www.facebook.com/myrehat' ),
				'linkedin'  => array( 'LinkedIn', 'https://www.linkedin.com/company/myrehat' ),
				'instagram' => array( 'Instagram', 'https://www.instagram.com/myrehat' ),
				'tiktok'    => array( 'TikTok', 'https://www.tiktok.com/@myrehat' ),
				'youtube'   => array( 'YouTube', 'https://www.youtube.com/@myrehat' ),
			);

			foreach ( $myrehat_socials as $myrehat_slug => $myrehat_social ) :
				?>
				<a href="<?php echo esc_url( $myrehat_social[1] ); ?>"
					class="social-link social-<?php echo esc_attr( $myrehat_slug ); ?>"
					target="_blank" rel="noopener noreferrer"
					aria-label="<?php echo esc_attr( $myrehat_social[0] ); ?>">
					<?php echo myrehat_test_icon( $myrehat_slug ); // phpcs:ignore WordPress.Security.EscapeOutput -- static inline SVG. ?>
					<span class="screen-reader-text"><?php echo esc_html( $myrehat_social[0] ); ?></span>
				</a>
			<?php endforeach; ?>
		</nav>

		<p class="trails-copyright">&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> MyRehat</p>
	</footer>
</div>
<?php get_footer(); ?>
