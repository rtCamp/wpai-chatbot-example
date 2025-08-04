<?php
/**
 * Assets class.
 *
 * @package rtCamp\WPAI_Chatbot\Modules\Core
 */

declare(strict_types = 1);

namespace rtCamp\WPAI_Chatbot\Modules\Core;

use rtCamp\WPAI_Chatbot\Contracts\Interfaces\Registrable;

/**
 * Class Assets
 */
final class Assets implements Registrable {
	/**
	 * The relative to the built assets directory.
	 * No preceding or trailing slashes.
	 */
	private const ASSETS_DIR = 'assets/build';

	/**
	 * {@inheritDoc}
	 */
	public function register_hooks(): void {
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
	}

	/**
	 * To enqueue scripts and styles.
	 */
	public function enqueue_scripts(): void {
		$this->register_script( 'wpai-chatbot-script', 'main' );
		$this->register_style( 'wpai-chatbot-style', 'main' );

		// Only enqueue the scripts if the iframe URL is set.
		$options    = get_option( 'wpai_chatbot_settings' );
		$iframe_url = $options['wpai_chatbot_iframe_url'] ?? '';

		if ( empty( $iframe_url ) ) {
			return;
		}

		// Enqueue styles.
		wp_enqueue_style( 'dashicons' );
		wp_enqueue_style( 'wpai-chatbot-style' );

		// Localize the & enqueue the script with the iframe URL.
		wp_localize_script(
			'wpai-chatbot-script',
			'wpai-chatbot-ApiSettings',
			[
				'embedUrl' => $iframe_url,
			]
		);
		wp_enqueue_script( 'wpai-chatbot-script' );
	}

	/**
	 * Register a script.
	 *
	 * @param string   $handle    Name of the script. Should be unique.
	 * @param string   $filename  Path of the script relative to js directory.
	 *                            excluding the .js extension.
	 * @param string[] $deps      Optional. An array of registered script handles this script depends on. If not set, the dependencies will be inherited from the asset file.
	 * @param ?string  $ver       Optional. String specifying script version number, if not set, the version will be inherited from the asset file.
	 * @param bool     $in_footer Optional. Whether to enqueue the script before </body> instead of in the <head>.
	 */
	private function register_script( string $handle, string $filename, array $deps = [], $ver = null, bool $in_footer = true ): bool {
		// Bail if missing constants.
		if ( ! defined( 'WPAI_CHATBOT_DIR' ) || ! defined( 'WPAI_CHATBOT_URL' ) ) {
			return false;
		}

		$asset_file = sprintf( '%s/js/%s.asset.php', trailingslashit( WPAI_CHATBOT_DIR ) . untrailingslashit( self::ASSETS_DIR ), $filename );

		// Bail if the asset file does not exist.
		if ( ! file_exists( $asset_file ) ) {
			return false;
		}

		// phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable -- The file is checked for existence above.
		$asset = require_once $asset_file;

		$version   = $ver ?? ( $asset['version'] ?? filemtime( $asset_file ) );
		$asset_src = sprintf( '%s/js/%s.js', trailingslashit( WPAI_CHATBOT_URL ) . untrailingslashit( self::ASSETS_DIR ), $filename );

		return wp_register_script(
			$handle,
			$asset_src,
			$deps ?: $asset['dependencies'],
			$version ?: false,
			$in_footer
		);
	}

	/**
	 * Register a CSS stylesheet
	 *
	 * @param string   $handle    Name of the stylesheet. Should be unique.
	 * @param string   $filename  Path of the stylesheet relative to the css directory,
	 *                            excluding the .css extension.
	 * @param string[] $deps      Optional. An array of registered stylesheet handles this stylesheet depends on. Default empty array.
	 * @param ?string  $ver       Optional. String specifying style version number, if not set, the version will be inherited from the asset file.
	 *
	 * @param string   $media     Optional. The media for which this stylesheet has been defined.
	 *                            Default 'all'. Accepts media types like 'all', 'print' and 'screen', or media queries like
	 *                            '(orientation: portrait)' and '(max-width: 640px)'.
	 */
	private function register_style( string $handle, string $filename, array $deps = [], $ver = null, string $media = 'all' ): bool {
		// Bail if missing constants.
		if ( ! defined( 'WPAI_CHATBOT_DIR' ) || ! defined( 'WPAI_CHATBOT_URL' ) ) {
			return false;
		}

		// CSS doesnt have a PHP assets file so we infer from the file itself.
		$asset_file = sprintf( '%s/css/%s.css', trailingslashit( WPAI_CHATBOT_DIR ) . untrailingslashit( self::ASSETS_DIR ), $filename );

		// Bail if the asset file does not exist.
		if ( ! file_exists( $asset_file ) ) {
			return false;
		}

		$version   = $ver ?? (string) filemtime( $asset_file );
		$asset_src = sprintf( '%s/css/%s.css', trailingslashit( WPAI_CHATBOT_URL ) . untrailingslashit( self::ASSETS_DIR ), $filename );

		// Register as a style.
		return wp_register_style(
			$handle,
			$asset_src,
			$deps,
			$version ?: false,
			$media
		);
	}
}
