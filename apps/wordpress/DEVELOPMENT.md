# Development Guide

Code contributions, bug reports, and feature requests are welcome! The following document provides information about development processes and testing.

> [!TIP]
> To learn more about contributing to the project, please read our [Code of Conduct](./CODE_OF_CONDUCT.md) and [Contributing Guidelines](./CONTRIBUTING.md) guidelines.

## TOC

- [Development Guide](#development-guide)
    - [TOC](#toc)
    - [Directory Structure](#directory-structure)
    - [Local Development](#local-development)
        - [Prerequisites](#prerequisites)
        - [Quick Start](#quick-start)
        - [Setup Plugin Locally](#setup-plugin-locally)
        - [Building for Production](#building-for-production)
    - [Code Contributions (Pull Requests)](#code-contributions-pull-requests)
        - [Workflow](#workflow)
        - [Code Quality / Code Standards](#code-quality--code-standards)
            - [PHP_CodeSniffer](#php_codesniffer)
            - [PHPStan](#phpstan)
            - [ESLint](#eslint)

## Directory Structure

The plugin is organized as follows:

<details>
<summary> Click to expand </summary>

```log
wpai-chatbot/apps/wordpress/ # 🎯 The path inside the monorepo.
│
│
├── assets/
│   │   # The built assets, compiled via `npm run build:dist`.
│   │   # They are excluded from the repository and should not be edited directly.
│   ├── build/
│   │   # The source assets.
│   └── src/
│       ├── css/         # CSS source files.
│       └── js/          # JavaScript source files.
│
│   # PHP classes and functions.
│   # Classes follow PSR-4, and are namespaced at `rtCamp\WPAI_Chatbot`.
├── inc/
│   │   # Interfaces, traits, and abstract classes.
│   ├── Contracts/
│   │   ├── Interfaces/
│   │   │   ├── Module.php          # The interface for all modules.
│   │   │   └── Registrable.php     # The interface for classes that can be registered.
│   │   └── Traits/
│   │       └── Singleton.php  # The singleton trait.
│   │
│   │   # Individual features exist as co-located "Modules".
│   │   # Modules are self-contained and loaded via a `{Module}.php` file, and (usually) a corresponding namespace.
│   ├── Modules/
│   │   ├── Chat/
│   │   │   └── Frontend.php # Handles injecting the chat UI into the frontend.
│   │   │
│   │   ├── Core/
│   │   │  ├── Admin.php         # Handles admin-specific functionality.
│   │   │  └── Assets.php        # Handles asset registration.
│   │   │
│   │   ├── RestAPI/
│   │   │  ├── AbstractRestAPI.php # The base class for all REST API endpoints.
│   │   │  └── ChatController.php # Handles the chat REST API endpoints.
│   │   │
│   ├── Autoloader.php   # The PSR-4 autoloader for the plugin.
│   ├── Dependencies.php # Manages plugin dependencies (e.g. WPGraphQL versions).
│   └── Main.php         # The main plugin class.
│
├── phpstan/               # PHPStan configuration and rules
│
├── node_modules/          # Node.js dependencies
├── vendor/                # Composer dependencies
│
│   # Important root files.
└── wpai-chatbot.php      # Main plugin file

```

</details>

## Local Development

### Prerequisites

- [Composer](https://getcomposer.org/) v2.0 or higher
- [Node.js](https://nodejs.org/) v22.0 or higher

To use the Docker-ized test environment and to run the tests, you will also need:

- [Docker](https://www.docker.com/) running Docker Compose v2.20 or higher.

### Quick Start

```bash
# Clone the repository
git clone

# Switch to the plugin directory
cd wpai-chatbot

# Symlink the plugin to your local WordPress installation
ln -s $(pwd) /path/to/your/wordpress/wp-content/plugins/wpai-chatbot

### Commands
# For all commands, see the `package.json` file in the root directory.

# Run lints
npm run lint
npm run lint:js:fix
npm run lint:php:stan

# Build the plugin for production and generate a .zip file
npm run build:dist
npm run plugin-zip
```

### Setup Plugin Locally

For the plugin to work locally, you need to install both the NPM and Composer dependencies, and then build the Assets.

```bash
npm run install-local-deps
```

This command will install the NPM and Composer dependencies and build the assets.

### Building for Production

To build the plugin for production, run the following command:

```bash
npm run build:prod
```

This will clean up the dev-dependencies and build the assets.

You can then generate the production `.zip` file by with the following command:

```bash
npm run plugin-zip

```

## Code Contributions (Pull Requests)

### Workflow

The `develop` branch is used for active development, while `main` contains a snapshot the current stable release. Always create a new branch from `develop` when working on a new feature or bug fix.

Branches should be prefixed with the type of change (e.g. `feat`, `chore`, `tests`, `fix`, etc.) followed by a short description of the change. For example, a branch for a new feature called "Add new feature" could be named `feat/add-new-feature`.

### Code Quality / Code Standards

This project uses several tools to ensure code quality and standards are maintained:

#### PHP_CodeSniffer

This project uses [PHP_CodeSniffer](https://github.com/PHPCSStandards/PHP_CodeSniffer/) to enforce WordPress Coding Standards. We use the [rtCamp Coding Standards D ruleset](https://github.com/rtCamp/coding-standards-d), which is a superset of [WPCS](https://github.com/WordPress/WordPress-Coding-Standards), [VIPCS](https://github.com/Automattic/VIP-Coding-Standards), and [Slevomat Coding Standard](https://github.com/slevomat/coding-standard) tailored for the WPGraphQL ecosystem.

Our specific ruleset is defined in the [`phpcs.xml.dist`](phpcs.xml.dist) file.

You can run the PHP_CodeSniffer checks using the following command:

```bash
npm run lint:php
```

PHP_CodeSniffer can automatically fix some issues. To fix issues automatically, run:

```bash
npm run lint:php:fix
```

#### PHPStan

This project uses [PHPStan](https://phpstan.org/) to perform static analysis on the PHP code. PHPStan is a PHP Static Analysis Tool that focuses on finding errors in your code without actually running it.

You can run PHPStan using the following command:

```bash
npm run lint:phpstan
```

#### ESLint

This project uses [ESLint](https://eslint.org) through `@wordpress/scripts` and `@wordpress/eslint-plugin` for JavaScript linting, following WordPress coding standards and best practices.

You can run ESLint on JavaScript files using:

```bash
npm run lint:js
```

To automatically fix JavaScript linting issues:

```bash
npm run lint:js:fix
```

You can also generate a detailed JSON report of linting issues:

```bash
npm run lint:js:report
```
