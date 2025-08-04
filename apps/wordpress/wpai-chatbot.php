<?php
/**
 * Plugin Name: WPAI Chatbot
 * Version: 0.1.0
 * Description: Search for content from and outside the website using AI.
 * Author: Danish Shakeel, Utsav Patel, David Levine, rtCamp
 * Plugin URI:        https://rtcamp.com
 * Author URI:        https://rtcamp.com
 * Text Domain:       wpai-chatbot
 * Version:           0.1.0
 * Requires PHP:      8.1
 *
 * @package rtCamp\WPAI_Chatbot
 */

declare (strict_types = 1);

namespace rtCamp\WPAI_Chatbot;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit();

/**
 * Define the plugin constants.
 */
function constants(): void {
	/**
	 * The plugin directory path.
	 */
	define( 'WPAI_CHATBOT_DIR', plugin_dir_path( __FILE__ ) );

	/**
	 * The plugin URL.
	 */
	define( 'WPAI_CHATBOT_URL', plugin_dir_url( __FILE__ ) );
}

constants();
// Load the autoloader.
require_once __DIR__ . '/inc/Autoloader.php';

// If autoloader failed, we cannot proceed.
if ( ! \rtCamp\WPAI_Chatbot\Autoloader::autoload() ) {
	return;
}

// Load the plugin.
if ( class_exists( 'rtCamp\WPAI_Chatbot\Main' ) ) {
	\rtCamp\WPAI_Chatbot\Main::instance();
}
