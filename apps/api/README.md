# WPAI Chatbot - API Application

This is the API application built using the [NestJS](https://nestjs.com) framework. It serves as the backend for the platform, providing RESTful endpoints and core business logic.

## Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm run start:dev
```

## Endpoints

### Messages

- **GET /messages**: Retrieve all messages with optional filters:
  - `page`: Page number (default: 1)
  - `limit`: Number of items per page (default: 10)
  - `sessionId`: Filter by session ID
  - `status`: Filter by message status

- **GET /messages/:id**: Retrieve a specific message by its ID.

- **GET /messages/:id/stream**: Stream the response of a message.

- **GET /messages/session/:sessionId**: Retrieve messages by session ID with optional filters:
  - `page`: Page number (default: 1)
  - `limit`: Number of items per page (default: 10)
  - `status`: Filter by message status
  - `sort`: Sort order (default: `desc`)

- **POST /messages**: Create a new message.

- **PATCH /messages/:id**: Update an existing message by its ID.

- **DELETE /messages/:id**: Delete a message by its ID.

- **POST /messages/search**: Perform a search for messages based on specific criteria.

## Development & Contribution

Development guidelines are not available for this app. Please refer to the [root repository DEVELOPMENT.md](../../docs/DEVELOPMENT.md) for general guidelines.

## Like What You See?

<a href="https://rtcamp.com/"><img src="https://rtcamp.com/wp-content/uploads/sites/2/2019/04/github-banner@2x.png" alt="Join us at rtCamp, we specialize in providing high performance enterprise WordPress solutions"></a>
