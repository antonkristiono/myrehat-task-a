<?php
/**
 * MyRehat Test child theme — functions.php
 *
 * Part 2 fixes:
 *   B1  every translatable string now carries the 'myrehat-test' text domain
 *   B2  booking handler: nonce verification + sanitization + safe redirect
 *   B3  myrehat_trail_viewed now passes 2 arguments to the counter callback
 */

defined( 'ABSPATH' ) || exit;

/* -------------------------------------------------------------------------
 * Pricing rules (single source of truth for PHP and JS)
 * ---------------------------------------------------------------------- */
define( 'MYREHAT_DAILY_RATE', 350 );
define( 'MYREHAT_MONTHLY_DAYS', 30 );
define( 'MYREHAT_MONTHLY_DISCOUNT', 0.8 );

/* -------------------------------------------------------------------------
 * Theme setup
 * ---------------------------------------------------------------------- */
add_action( 'after_setup_theme', 'myrehat_test_setup' );
function myrehat_test_setup() {
	load_child_theme_textdomain( 'myrehat-test', get_stylesheet_directory() . '/languages' );
}

/* -------------------------------------------------------------------------
 * Assets
 * ---------------------------------------------------------------------- */
add_action( 'wp_enqueue_scripts', 'myrehat_test_assets' );
function myrehat_test_assets() {
	wp_enqueue_style( 'myrehat-test-style', get_stylesheet_uri(), array(), '1.1.0' );
	wp_enqueue_script(
		'myrehat-test-trails',
		get_stylesheet_directory_uri() . '/trails.js',
		array(),
		'1.1.0',
		true
	);
}

/* -------------------------------------------------------------------------
 * B1 — translation with text domain
 * ---------------------------------------------------------------------- */
function myrehat_test_booking_title() {
	return __( 'Book a guided hike', 'myrehat-test' );
}

/* -------------------------------------------------------------------------
 * Pricing helpers (A11)
 * ---------------------------------------------------------------------- */
function myrehat_test_booking_total( $plan ) {
	if ( 'monthly' === $plan ) {
		return (int) round( MYREHAT_DAILY_RATE * MYREHAT_MONTHLY_DAYS * MYREHAT_MONTHLY_DISCOUNT );
	}
	return (int) MYREHAT_DAILY_RATE;
}

function myrehat_test_format_rm( $amount ) {
	return 'RM ' . number_format_i18n( (float) $amount, 0 );
}

/**
 * Only accept a real Y-m-d date, otherwise return an empty string.
 */
function myrehat_test_sanitize_date( $value ) {
	$value = sanitize_text_field( $value );
	if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $value ) ) {
		return '';
	}
	$date = DateTime::createFromFormat( 'Y-m-d', $value );
	if ( ! $date || $date->format( 'Y-m-d' ) !== $value ) {
		return '';
	}
	return $value;
}

/* -------------------------------------------------------------------------
 * B2 — booking handler (nonce + sanitization + safe redirect)
 * ---------------------------------------------------------------------- */
add_action( 'admin_post_nopriv_myrehat_booking', 'myrehat_test_booking_handler' );
add_action( 'admin_post_myrehat_booking', 'myrehat_test_booking_handler' );

function myrehat_test_booking_handler() {
	$referer  = wp_get_referer();
	$redirect = $referer ? $referer : home_url( '/' );

	// Only handle our own form submissions.
	if ( ! isset( $_POST['trails_booking'] ) ) {
		wp_safe_redirect( $redirect );
		exit;
	}

	// 1. Nonce check — rejects forged / replayed submissions.
	$nonce = isset( $_POST['myrehat_booking_nonce'] )
		? sanitize_text_field( wp_unslash( $_POST['myrehat_booking_nonce'] ) )
		: '';

	if ( ! wp_verify_nonce( $nonce, 'myrehat_booking' ) ) {
		wp_safe_redirect( add_query_arg( 'booking', 'invalid', $redirect ) );
		exit;
	}

	// 2. Sanitize every field before it touches the database.
	$name  = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$date  = isset( $_POST['date'] ) ? myrehat_test_sanitize_date( wp_unslash( $_POST['date'] ) ) : '';

	$plan = isset( $_POST['plan'] ) ? sanitize_key( wp_unslash( $_POST['plan'] ) ) : 'daily';
	if ( ! in_array( $plan, array( 'daily', 'monthly' ), true ) ) {
		$plan = 'daily';
	}

	// A6 — Digital Nomad is mandatory: store only an explicit yes/no.
	$digital_nomad = ( isset( $_POST['digital_nomad'] ) && 'yes' === sanitize_key( wp_unslash( $_POST['digital_nomad'] ) ) ) ? 'Yes' : 'No';
	$nomad_valid   = isset( $_POST['digital_nomad'] ) && in_array( sanitize_key( wp_unslash( $_POST['digital_nomad'] ) ), array( 'yes', 'no' ), true );

	// A9 — Host Terms must be accepted.
	$host_terms = isset( $_POST['host_terms'] ) && '1' === sanitize_text_field( wp_unslash( $_POST['host_terms'] ) );

	if ( '' === $name || '' === $email || '' === $date || ! $nomad_valid || ! $host_terms ) {
		wp_safe_redirect( add_query_arg( 'booking', 'invalid', $redirect ) );
		exit;
	}

	$total = myrehat_test_booking_total( $plan );

	$booking = array(
		'name'          => $name,
		'email'         => $email,
		'date'          => $date,
		'plan'          => $plan,
		'total'         => $total,
		'digital_nomad' => $digital_nomad,
		'host_terms'    => 'agreed',
		'created'       => time(),
	);

	// Random one-time token instead of dumping user data into the URL (A12).
	$token = wp_generate_password( 20, false, false );
	set_transient( 'myrehat_booking_' . $token, $booking, HOUR_IN_SECONDS );

	// Keep the legacy transient the original code used, for compatibility.
	set_transient( 'trails_last_booking', $date, HOUR_IN_SECONDS );

	wp_safe_redirect( add_query_arg( 'booking', $token, $redirect ) );
	exit;
}

/* -------------------------------------------------------------------------
 * B3 — hook accepted 1 argument while the callback expects 2
 * ---------------------------------------------------------------------- */
add_action( 'myrehat_trail_viewed', 'myrehat_test_count_view', 10, 2 );

function myrehat_test_count_view( $trail_id, $count = 1 ) {
	$trail_id = absint( $trail_id );
	if ( ! $trail_id ) {
		return;
	}
	$key   = 'trail_views_' . $trail_id;
	$total = (int) get_option( $key, 0 );
	update_option( $key, $total + absint( $count ) );
}

/* -------------------------------------------------------------------------
 * A3 — sticky WhatsApp / LINE buttons (site-wide)
 * ---------------------------------------------------------------------- */
add_action( 'wp_footer', 'myrehat_test_quick_contact' );
function myrehat_test_quick_contact() {
	$whatsapp = 'https://wa.me/60123456789?text=' . rawurlencode( 'Hi MyRehat, I would like to book a trail.' );
	$line     = 'https://line.me/R/ti/p/@myrehat';
	?>
	<div class="myrehat-quick-contact" aria-label="<?php echo esc_attr__( 'Quick contact', 'myrehat-test' ); ?>">
		<a class="quick-contact-btn quick-contact-wa" href="<?php echo esc_url( $whatsapp ); ?>" target="_blank" rel="noopener noreferrer">
			<?php echo myrehat_test_icon( 'whatsapp' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<span><?php echo esc_html__( 'WhatsApp', 'myrehat-test' ); ?></span>
		</a>
		<a class="quick-contact-btn quick-contact-line" href="<?php echo esc_url( $line ); ?>" target="_blank" rel="noopener noreferrer">
			<?php echo myrehat_test_icon( 'line' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<span><?php echo esc_html__( 'LINE', 'myrehat-test' ); ?></span>
		</a>
	</div>
	<?php
}

/**
 * Inline SVG icon set (no external requests, no icon-font dependency).
 */
function myrehat_test_icon( $name ) {
	$icons = array(
		'whatsapp' => '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.24-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>',
		'line'     => '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2C6.48 2 2 5.68 2 10.22c0 2.4 1.28 4.53 3.36 5.99.15.11.24.28.24.47 0 .36-.09 1.16-.1 1.32 0 .2-.17.4-.4.4a.4.4 0 0 1-.18-.04c-.19-.08-2.16-.99-2.96-1.72C1.36 15.2 1 13.75 1 12.2 1 6.9 5.93 2 12 2s11 4.9 11 10.2c0 5.3-4.93 10.2-11 10.2-.94 0-1.85-.11-2.72-.32a.52.52 0 0 1-.2-.09l-3.2 1.62a.4.4 0 0 1-.55-.5l.56-2.06a.45.45 0 0 0-.15-.5C2.98 19.3 1 16.2 1 12.2Z" opacity=".15"/><path fill="currentColor" d="M12 20.4c5.58 0 10.1-4.37 10.1-9.75C22.1 5.27 17.58.9 12 .9S1.9 5.27 1.9 10.65c0 4.82 3.92 8.85 9.1 9.6l.5.07.02 2.1 1.2-.62c.35-.18.7-.32 1.06-.43.14-.05.28-.07.42-.07Z" opacity="0"/><path fill="currentColor" d="M7.1 7.9h1.5v5h-1.5zM9.9 7.9h1.4v2.9l2.5-2.9h1.9l-2.9 3.3 2.9 1.7h-1.9l-2.5-1.55V12.9H9.9zM16.5 7.9h1.4v3.6h1.6v1.4h-3z"/></svg>',
		'facebook' => '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5h1.65V4.6c-.29-.04-1.27-.12-2.4-.12-2.38 0-4 1.45-4 4.11V10.9H7.6V14h2.7v8h3.2Z"/></svg>',
		'linkedin' => '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.94 8.5H3.56V21h3.38V8.5ZM5.25 3a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM21 14.2c0-3.4-1.82-4.99-4.25-4.99-1.96 0-2.84 1.08-3.33 1.84V8.5H9.98V21h3.44v-6.98c0-1.55.29-3.05 2.21-3.05 1.9 0 1.92 1.77 1.92 3.15V21H21v-6.8Z"/></svg>',
		'instagram'=> '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-10.4a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z"/></svg>',
		'tiktok'   => '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.6 2h-3.1v13.1a2.6 2.6 0 1 1-2.2-2.57V9.36a5.7 5.7 0 1 0 5.3 5.68V8.6a6.9 6.9 0 0 0 4 1.28V6.77a3.8 3.8 0 0 1-4-3.77V2Z"/></svg>',
		'youtube'  => '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77C22 15.2 22 12 22 12s0-3.2-.4-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z"/></svg>',
	);

	return isset( $icons[ $name ] ) ? $icons[ $name ] : '';
}

/* -------------------------------------------------------------------------
 * Elementor hero (section template exported from the Elementor library)
 * ---------------------------------------------------------------------- */
function myrehat_test_hero_html() {
	$template_id = (int) get_option( 'myrehat_hero_template_id', 0 );

	if ( $template_id && did_action( 'elementor/loaded' ) && class_exists( '\Elementor\Plugin' ) ) {
		$markup = \Elementor\Plugin::$instance->frontend->get_builder_content_for_display( $template_id, true );
		if ( is_string( $markup ) && '' !== trim( $markup ) ) {
			return $markup;
		}
	}

	return myrehat_test_hero_fallback();
}

/**
 * Plain PHP hero — used until the Elementor section is imported.
 */
function myrehat_test_hero_fallback() {
	ob_start();
	?>
	<header class="site-header-trails">
		<h1><?php echo esc_html( get_bloginfo( 'name' ) ); ?></h1>
		<p><?php echo esc_html__( 'Find your next trail with MyRehat', 'myrehat-test' ); ?></p>
		<input id="main-search" type="search" placeholder="<?php esc_attr_e( 'Search trails...', 'myrehat-test' ); ?>" aria-label="<?php esc_attr_e( 'Search trails', 'myrehat-test' ); ?>">
	</header>
	<?php
	return ob_get_clean();
}
