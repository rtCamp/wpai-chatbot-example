<?php
/**
 * Interface for Module classes.
 *
 * Modules have an init method that is called to initialize the module.
 *
 * @package rtCamp\WPAI_Chatbot
 */

declare( strict_types = 1 );

namespace rtCamp\WPAI_Chatbot\Contracts\Interfaces;

/**
 * Interface - Module
 */
interface Module {
	/**
	 * Initializes the module.
	 */
	public function init(): void;
}
