<?php
/**
 * Import the Elementor hero and create the front page for local development.
 *
 * Run from the repository root:
 *
 *   docker compose -f docker-compose.local.yml run --rm \
 *     -v "$PWD/scripts:/scripts:ro" \
 *     -v "$PWD/elementor:/elementor:ro" \
 *     wpcli eval-file /scripts/setup-content.php
 */

$json_path = '/elementor/tropic-hiking-trails-hero.json';

if ( ! file_exists( $json_path ) ) {
	fwrite( STDERR, "Elementor export not found at {$json_path}\n" );
	exit( 1 );
}

$data = json_decode( file_get_contents( $json_path ), true );

if ( ! is_array( $data ) || empty( $data['content'] ) ) {
	fwrite( STDERR, "Could not parse Elementor export at {$json_path}\n" );
	exit( 1 );
}

// 1. Import the hero as an Elementor Library section.
$existing = get_posts(
	array(
		'post_type'      => 'elementor_library',
		'post_status'    => 'any',
		'meta_key'       => '_elementor_template_type',
		'meta_value'     => 'section',
		'posts_per_page' => 1,
		'fields'         => 'ids',
	)
);

$template_id = $existing ? (int) $existing[0] : 0;

if ( ! $template_id ) {
	$template_id = wp_insert_post(
		array(
			'post_title'  => $data['title'] ?? 'Tropic Hiking Trails — Hero section',
			'post_type'   => 'elementor_library',
			'post_status' => 'publish',
		),
		true
	);
}

if ( is_wp_error( $template_id ) ) {
	fwrite( STDERR, $template_id->get_error_message() . "\n" );
	exit( 1 );
}

update_post_meta( $template_id, '_elementor_template_type', $data['type'] ?? 'section' );
update_post_meta( $template_id, '_elementor_edit_mode', 'builder' );
update_post_meta( $template_id, '_elementor_version', $data['version'] ?? '0.4' );
update_post_meta( $template_id, '_elementor_data', wp_slash( wp_json_encode( $data['content'] ) ) );
update_option( 'myrehat_hero_template_id', $template_id );

// 2. Front page using the theme's page-trails.php template.
$page    = get_page_by_path( 'trails' );
$page_id = $page ? (int) $page->ID : 0;

if ( ! $page_id ) {
	$page_id = wp_insert_post(
		array(
			'post_title'  => 'Tropic Hiking Trails',
			'post_name'   => 'trails',
			'post_type'   => 'page',
			'post_status' => 'publish',
		),
		true
	);
}

if ( is_wp_error( $page_id ) ) {
	fwrite( STDERR, $page_id->get_error_message() . "\n" );
	exit( 1 );
}

update_post_meta( $page_id, '_wp_page_template', 'page-trails.php' );
update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $page_id );
update_option( 'blogname', 'Tropic Hiking Trails' );
update_option( 'blogdescription', 'Find your next trail with MyRehat' );
update_option( 'permalink_structure', '/%postname%/' );
flush_rewrite_rules();

echo "Elementor hero template ID: {$template_id}\n";
echo "Front page ID: {$page_id}\n";
echo 'Site title: ' . get_option( 'blogname' ) . "\n";
