<?php
/**
 * Registers the REST routes for the chat functionality.
 *
 * @package rtCamp\WPAI_Chatbot\RestAPI
 */

declare(strict_types = 1);

namespace rtCamp\WPAI_Chatbot\Modules\RestAPI;

use rtCamp\WPAI_Chatbot\Contracts\Interfaces\Registrable;

/**
 * Class - ChatController.
 */
final class ChatController extends AbstractRestAPI implements Registrable {
	/**
	 * Version.
	 *
	 * @var string
	 */
	protected $version = '1';

	/**
	 * The namespace for this controller's routes.
	 *
	 * @var string
	 */
	protected $namespace = 'wpai-chatbot/v';

	/**
	 * {@inheritDoc}
	 */
	public function register_routes(): void {
		register_rest_route(
			'wpai-chatbot/v1',
			'/messagePerUser',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_messages_per_user' ],
				'permission_callback' => '__return_true',
			]
		);

		register_rest_route(
			'wpai-chatbot/v1',
			'/ping',
			[
				'methods'             => 'GET',
				'callback'            => function () {
					return rest_ensure_response( [ 'status' => 'active' ] );
				},
				'permission_callback' => '__return_true',
			]
		);

		register_rest_route(
			'wpai-chatbot/v1',
			'/token',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'store_token' ],
				'permission_callback' => [ $this, 'check_api_key' ],
			]
		);

		register_rest_route(
			'wpai-chatbot/v1',
			'/get_enable_search_result',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_enable_search_result' ],
				'permission_callback' => '__return_true',
			]
		);

		register_rest_route(
			'wpai-chatbot/v1',
			'/keyword_query_weightage',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_keyword_query_weightage' ],
				'permission_callback' => [ $this, 'check_api_key' ],
			]
		);
	}

	/**
	 * Get the messages_per_user value from the options table.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_messages_per_user(): \WP_REST_Response {
		$options           = get_option( 'wpai_chatbot_settings' );
		$messages_per_user = $options['messages_per_user'] ?? 3;

		return rest_ensure_response(
			[
				'messages_per_user' => (int) $messages_per_user,
			]
		);
	}

	/**
	 * Store the activation token in the options table.
	 *
	 * @return \WP_REST_Response
	 */
	public function store_token(): \WP_REST_Response {
		// phpcs:ignore WordPressVIPMinimum.Performance.FetchingRemoteData.FileGetContentsRemoteFile
		$parameters = json_decode( (string) file_get_contents( 'php://input' ), true );
		$token      = sanitize_text_field( $parameters['token'] ?? '' );

		if ( empty( $token ) ) {
			return new \WP_REST_Response( [ 'error' => 'Missing token' ], 400 );
		}

		update_option( 'wpai_chatbot_activation_token', $token );
		return rest_ensure_response( [ 'status' => 'success' ] );
	}

	/**
	 * Check if the API key is valid.
	 *
	 * @return bool
	 */
	public function check_api_key(): bool {
		$options   = get_option( 'wpai_chatbot_settings' );
		$x_api_key = $options['wpai_chatbot_api_key'] ?? '';

		$headers          = getallheaders();
		$incoming_api_key = $headers['x-api-key'] ?? ( $headers['X-Api-Key'] ?? ( $headers['X-API-KEY'] ?? '' ) );

		return $x_api_key && $incoming_api_key && hash_equals( $x_api_key, $incoming_api_key );
	}

	/**
	 * Get the enable_wpai_chatbot_search_result value from the options table.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_enable_search_result(): \WP_REST_Response {
		$options = get_option( 'wpai_chatbot_settings' );
		return rest_ensure_response(
			[
				'enable_wpai_chatbot_search_result' => ! empty( $options['enable_wpai_chatbot_search_result'] ),
			]
		);
	}

	/**
	 * Get the keyword query weightage from the options table.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_keyword_query_weightage(): \WP_REST_Response {
		$options = get_option( 'wpai_chatbot_settings' );
		return rest_ensure_response(
			[
				'wpai_chatbot_keyword_query_weightage' => $options['keyword_weightage'] ?? '0.4',
			]
		);
	}
}
