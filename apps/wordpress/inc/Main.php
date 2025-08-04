<?php
/**
 * The main plugin file.
 *
 * @package rtCamp\WPAI_Chatbot
 */

declare(strict_types = 1);

namespace rtCamp\WPAI_Chatbot;

use rtCamp\WPAI_Chatbot\Contracts\Traits\Singleton;

/**
 * Class - Main
 */
final class Main {
	use Singleton;

	/**
	 * Modules are the entry-point classes for various functionalities.
	 */
	const MODULE_CLASSES = [
		Modules\Core\Admin::class,
		Modules\Core\Assets::class,
		Modules\Chat\Frontend::class,
		Modules\RestAPI\ChatController::class,
	];

	/**
	 * {@inheritDoc}
	 */
	public static function instance(): self {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
			self::$instance->setup();

			/**
			 * Fires after the main plugin class has been initialized.
			 *
			 * @param self $instance The main plugin class instance.
			 */
			do_action( 'wpai_chatbot/features/init', self::$instance );
		}

		return self::$instance;
	}

	/**
	 * Setup the plugin.
	 */
	private function setup(): void {
		// Load the plugin classes.
		$this->load();

		// Do other stuff here like dep-checking, telemetry, etc.
	}

	/**
	 * Load the plugin classes.
	 */
	private function load(): void {
		// Loop through all the classes, instantiate them, and register any hooks.
		foreach ( self::MODULE_CLASSES as $class_name ) {
			/**
			 * If it's a singleton, we can use the instance method. Otherwise we instantiate it directly.
			 */
			$instance = method_exists( $class_name, 'instance' ) ? $class_name::instance() : new $class_name();

			// Modules handle hooks in the init method.
			if ( $instance instanceof Contracts\Interfaces\Module ) {
				$instance->init();
			}

			// Hooks should be registered outside of the constructor.
			if ( $instance instanceof Contracts\Interfaces\Registrable ) {
				$instance->register_hooks();
			}

			// Do other generalizable stuff here.
		}
	}
}
