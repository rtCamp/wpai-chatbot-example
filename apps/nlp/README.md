# WPAI_CHATBOT - NLP App

Application for natural language processing tasks, including text analysis, entity recognition, and more.

> [!WARNING]
> 🐉 There be dragons!
> This is an experimental **proof of concept** and not meant for production use. For more information, please refer to the [root repository README](../../README.md).

## System Requirements

- **Python** 3.10+
- **Docker** (optional, for containerized deployment)

## Installation

1. Clone the repository and navigate to the `apps/nlp` directory.
2. Install dependencies:
   ```shell
   pip install -r requirements.txt
   ```
3. Download the spaCy model:
   ```shell
   python -m spacy download en_core_web_sm
   ```

## Quick Start

### Running the Application

To start the application:

```shell
python app.py
```

### Using Docker

To build and run the application using Docker:

```shell
docker build -t wpai-chatbot-nlp .
docker run -p 3100:3100 wpai-chatbot-nlp
```

## Endpoints

### Health Check

- **URL**: `/health-check`
- **Method**: `GET`
- **Description**: Returns `OK` if the service is running.

### Named Entity Recognition (NER)

- **URL**: `/ner`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "text": "Your input text here"
  }
  ```
- **Response**: A list of named entities and meaningful tokens.

## Development & Contribution

Development guidelines are not available for this app. Please refer to the [root repository DEVELOPMENT.md](../../docs/DEVELOPMENT.md) for general guidelines.

## Like what you see?

<a href="https://rtcamp.com/"><img src="https://rtcamp.com/wp-content/uploads/sites/2/2019/04/github-banner@2x.png" alt="Join us at rtCamp, we specialize in providing high performance enterprise WordPress solutions"></a>
