<?php
/**
 * PSR-4 Autoloader for PHP classes inside plugin.
 *
 * This can be removed and replaced with Composer's autoloader if needed.
 *
 * @package rtCamp\WPAI_Chatbot
 */

declare( strict_types = 1 );

namespace rtCamp\WPAI_Chatbot;

/**
 * Class - Autoloader
 */
class Autoloader {
	/**
	 * Whether the autoloader has been loaded.
	 *
	 * @var bool
	 */
	protected static bool $is_loaded = false;

	/**
	 * Attempts to autoload the Composer dependencies.
	 */
	public static function autoload(): bool {
		// If we're not *supposed* to autoload anything, then return true.
		if ( defined( 'WPAI_CHATBOT_AUTOLOAD' ) && false === WPAI_CHATBOT_AUTOLOAD ) {
			return true;
		}

		if ( self::$is_loaded ) {
			return self::$is_loaded;
		}

		$autoloader      = WPAI_CHATBOT_DIR . '/vendor/autoload.php';
		self::$is_loaded = self::require_autoloader( $autoloader );

		return self::$is_loaded;
	}

	/**
	 * Attempts to load the autoloader file, if it exists.
	 *
	 * @param string $autoloader_file The path to the autoloader file.
	 */
	protected static function require_autoloader( string $autoloader_file ): bool {
		if ( ! is_readable( $autoloader_file ) ) {
			self::missing_autoloader_notice();
			return false;
		}

		return (bool) require_once $autoloader_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable -- Autoloader is a Composer file.
	}

	/**
	 * Displays a notice if the autoloader is missing.
	 */
	protected static function missing_autoloader_notice(): void {
		$error_message = __( 'WPAI_Chatbot: The Composer autoloader was not found. If you installed the plugin from the GitHub source code, make sure to run `composer install`.', 'wpai-chatbot' );

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( esc_html( $error_message ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- This is a development notice.
		}

		$hooks = [
			'admin_notices',
			'network_admin_notices',
		];

		foreach ( $hooks as $hook ) {
			add_action(
				$hook,
				static function () use ( $error_message ) {
					?>
					<div class="error notice">
						<p>
							<?php echo esc_html( $error_message ); ?>
						</p>
					</div>
					<?php
				}
			);
		}
	}
}
