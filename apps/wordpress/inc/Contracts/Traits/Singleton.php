<?php
/**
 * Singleton trait.
 *
 * @package rtCamp\WPAI_Chatbot\Contracts\Traits
 */

declare(strict_types = 1);

namespace rtCamp\WPAI_Chatbot\Contracts\Traits;

/**
 * Singleton trait.
 */
trait Singleton {
	/**
	 * Instance of the class.
	 *
	 * @var ?static
	 */
	protected static $instance;

	/**
	 * Prevent the class from being instantiated directly.
	 */
	protected function __construct() {
		// To be implemented by the class using the trait.
	}

	/**
	 * Get the instance of the class.
	 *
	 * @return static
	 */
	public static function instance() {
		if ( ! isset( static::$instance ) ) {
			static::$instance = new static();
		}

		return static::$instance;
	}

	/**
	 * Prevent the class from being cloned.
	 */
	public function __clone() {
		_doing_it_wrong(
			__FUNCTION__,
			sprintf(
				// translators: %s: Class name.
				esc_html__( 'The %s class should not be cloned.', 'wpai-chatbot' ),
				esc_html( static::class ),
			),
			'0.0.1'
		);
	}

	/**
	 * Prevent the class from being deserialized.
	 */
	public function __wakeup() {
		_doing_it_wrong(
			__FUNCTION__,
			sprintf(
				// translators: %s: Class name.
				esc_html__( 'De-serializing instances of %s is not allowed.', 'wpai-chatbot' ),
				esc_html( static::class ),
			),
			'0.0.1'
		);
	}
}
