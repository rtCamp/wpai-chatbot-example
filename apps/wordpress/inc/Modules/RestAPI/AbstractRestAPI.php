<?php
/**
 * This can be used as the base to extend the WP_REST_Controller class.
 *
 * @package rtCamp\WPAI_Chatbot\RestAPI
 */

declare(strict_types = 1);

namespace rtCamp\WPAI_Chatbot\Modules\RestAPI;

use rtCamp\WPAI_Chatbot\Contracts\Interfaces\Registrable;

/**
 * Class - AbstractRestAPI
 */
abstract class AbstractRestAPI extends \WP_REST_Controller implements Registrable {
	/**
	 * Version.
	 *
	 * @var string
	 */
	protected $version = '1';

	/**
	 * Namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'api/v';

	/**
	 * {@inheritDoc}
	 */
	public function register_hooks(): void {
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @return void
	 * @throws \Exception If method not implemented.
	 */
	public function register_routes() {
		throw new \Exception( __FUNCTION__ . 'Method not implemented.' );
	}
}
