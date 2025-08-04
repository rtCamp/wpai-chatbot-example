<?php
/**
 * Creates an admin screen for the plugin.
 *
 * @package rtCamp\WPAI_Chatbot\Modules\Core
 */

declare(strict_types = 1);

namespace rtCamp\WPAI_Chatbot\Modules\Core;

use rtCamp\WPAI_Chatbot\Contracts\Interfaces\Registrable;

/**
 * Class - Admin
 */
final class Admin implements Registrable {
	/**
	 * {@inheritDoc}
	 */
	public function register_hooks(): void {
		add_action( 'admin_menu', [ $this, 'add_settings_page' ] );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
	}

	/**
	 * Add settings page to the admin menu
	 */
	public function add_settings_page(): void {
		add_options_page(
			'WPAI Chatbot Settings',
			'WPAI Chatbot',
			'manage_options',
			'wpai-chatbot',
			[ $this, 'settings_page_html' ]
		);
	}

	/**
	 * Register settings to get iframe URL
	 */
	public function register_settings(): void {
		register_setting( 'wpai-chatbot', 'wpai_chatbot_settings' );

		add_settings_section(
			'wpai_chatbot_settings_section',
			esc_html__( 'WPAI Chatbot Configuration', 'wpai-chatbot' ),
			[ $this, 'section_html' ],
			'wpai-chatbot'
		);

		// Add field to the section.
		add_settings_field(
			'wpai_chatbot_iframe_url',
			esc_html__( 'Iframe URL', 'wpai-chatbot' ),
			[ $this, 'iframe_url_html' ],
			'wpai-chatbot',
			'wpai_chatbot_settings_section'
		);

		add_settings_field(
			'messages_per_user',
			esc_html__( 'Messages Per User', 'wpai-chatbot' ),
			[ $this, 'messages_per_user_html' ],
			'wpai-chatbot',
			'wpai_chatbot_settings_section'
		);

		add_settings_field(
			'wpai_chatbot_search_result',
			esc_html__( 'Enable search result?', 'wpai-chatbot' ),
			[ $this, 'enable_wpai_chatbot_search_result' ],
			'wpai-chatbot',
			'wpai_chatbot_settings_section'
		);

		add_settings_field(
			'wpai_chatbot_keyword_weightage',
			esc_html__( 'Weightage for Keyword Query?', 'wpai-chatbot' ),
			[ $this, 'weightage_for_keyword_query' ],
			'wpai-chatbot',
			'wpai_chatbot_settings_section'
		);
	}

	/**
	 * Render settings page
	 */
	public function settings_page_html(): void {
		// Check user capabilities.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'WPAI Chatbot Settings', 'wpai-chatbot' ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( 'wpai-chatbot' );
				do_settings_sections( 'wpai-chatbot' );
				submit_button( 'Save Settings' );
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render section html
	 */
	public function section_html(): void {
		// @noop
	}

	/**
	 * Render iframe url field
	 */
	public function iframe_url_html(): void {
		$options    = get_option( 'wpai_chatbot_settings' );
		$iframe_url = $options['wpai_chatbot_iframe_url'] ?? '';
		?>
		<input
			type="url"
			id="wpai_chatbot_iframe_url"
			name="wpai_chatbot_settings[wpai_chatbot_iframe_url]"
			value="<?php echo esc_attr( $iframe_url ); ?>"
			class="regular-text"
			placeholder="https://wpai-chatbot.rtcamp.com/chat/chat-id"
		/>
		<p class="description">
			<?php esc_html_e( 'The URL for the WPAI Chatbot iframe that will be embedded on your site.', 'wpai-chatbot' ); ?>
		</p>
		<?php
	}

	/**
	 * Render messages per user field
	 */
	public function messages_per_user_html(): void {
		$options           = get_option( 'wpai_chatbot_settings' );
		$messages_per_user = $options['messages_per_user'] ?? 3;
		?>
		<input
			type="number"
			id="messages_per_user"
			name="wpai_chatbot_settings[messages_per_user]"
			value="<?php echo esc_attr( $messages_per_user ); ?>"
			class="small-text"
			min="1"
		/>
		<p class="description">
			<?php esc_html_e( 'Number of messages allowed per user without authentication.', 'wpai-chatbot' ); ?>
		</p>
		<?php
	}

	/**
	 * Render enable WPAI_Chatbot search result field
	 */
	public function enable_wpai_chatbot_search_result(): void {
		$options                           = get_option( 'wpai_chatbot_settings' );
		$enable_wpai_chatbot_search_result = $options['enable_wpai_chatbot_search_result'] ?? false;
		?>
		<input
			type="checkbox"
			id="enable-wpai-chatbot-search-result"
			name="wpai_chatbot_settings[enable_wpai_chatbot_search_result]"
			value="1"
			<?php checked( $enable_wpai_chatbot_search_result, true ); ?>
		/>
		<p class="description">
			<?php esc_html_e( 'Enable WPAI_CHATBOT search result?', 'wpai-chatbot' ); ?>
		</p>
		<?php
	}

	/**
	 * Render weightage for keyword query field
	 */
	public function weightage_for_keyword_query(): void {
		$options                           = get_option( 'wpai_chatbot_settings' );
		$enable_wpai_chatbot_search_result = $options['keyword_weightage'] ?? '0.4';
		?>
		<input
			type="text"
			id="wpai-chatbot-keyword-weightage"
			name="wpai_chatbot_settings[keyword_weightage]"
			value="<?php echo esc_attr( $enable_wpai_chatbot_search_result ); ?>"
			class="small-text"
		/>
		<p class="description">
			<?php esc_html_e( 'What is the weightage for keyword query out of 1? E.g. 0.4', 'wpai-chatbot' ); ?>
		</p>
		<?php
	}
}
