<?php
/**
 * Basic analytics.
 *
 * Non-production stub for the POC.
 *
 * @package rtCamp\WPAI_Chatbot\Modules\Chat
 */

declare(strict_types = 1);

namespace rtCamp\WPAI_Chatbot\Modules\Chat;

use rtCamp\WPAI_Chatbot\Contracts\Interfaces\Registrable;

/**
 * Class - Frontend
 */
class Frontend implements Registrable {
	/**
	 * {@inheritDoc}
	 */
	public function register_hooks(): void {
		add_action( 'wp_footer', [ $this, 'add_search_html' ] );
		add_filter( 'script_loader_tag', [ $this, 'check_for_gform_captcha' ], 10, 2 );
	}

	/**
	 * Check if the script is for Gravity Forms captcha
	 *
	 * @param string $tag The script tag.
	 * @param string $handle The script handle.
	 * @return string
	 */
	public function check_for_gform_captcha( string $tag, string $handle ): string {
		if ( 'deepsearch-captcha-validation' !== $handle ) {
			return $tag;
		}

		global $wp_scripts;
		$gforms_exists = isset( $wp_scripts->registered['gforms_recaptcha_recaptcha'] );

		// If GForms reCAPTCHA exists, remove our script.
		if ( $gforms_exists ) {
			return '';
		}

		return $tag;
	}

	/**
	 * Add search bar to the footer
	 */
	public function add_search_html(): void {
		$options    = get_option( 'wpai_chatbot_settings' );
		$iframe_url = $options['wpai_chatbot_iframe_url'] ?? null;
		?>
		<div id="wpai-chatbot-button" class="wpai-chatbot-button">
			<div class="container">
				<div class="animation-wrapper">
					<div class="orb blue-orb"></div>
					<div class="orb pink-orb"></div>
					<div class="orb green-orb"></div>
				</div>
			</div>

			<span class="wpai-chatbot-button-close">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"></path>
					<path d="m6 6 12 12"></path>
				</svg>
			</span>
		</div>
		<div id="wpai-chatbot-container" class="wpai-chatbot-container wpai-chatbot-hidden">
			<iframe
				id="wpai-chatbot-frame"
				src="<?php echo esc_url( $iframe_url ); ?>"
				title="<?php esc_attr_e( 'WPAI_Chatbot Chat', 'wpai-chatbot' ); ?>"
				frameborder="0"
				loading="lazy"
				allowtransparency="true"
				allow="clipboard-read; clipboard-write">
			</iframe>
		</div>
		<?php
	}
}
