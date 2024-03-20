# Chat with any File

This is a simple chat application that uses OpenAI embeddings to generate responses based on user input.

## Installation

1. Clone the repository:

   ```shell
   git clone https://github.com/RaheesAhmed/openai-embeddings-api.git
   ```

2. Install dependencies:

   ```shell
   cd chat-with-dir
   npm install
   ```

## Usage

1. Start the server:

   ```shell
   npm start
   ```

2. Open your web browser and navigate to `http://localhost:3000`.

3. Enter your message in the chat input field and press Enter.

4. The server will process your input using OpenAI embeddings and return a response.

## Configuration

### Endpoint Details

Here are examples of how to make a request to the `/chat` API endpoint.

URL: `/chat`
Method: `POST`
Content-Type: `application/json`
Request Body: `JSON object` with a userInput key containing the user's question.

Response: `JSON object` with a response key containing the chatbot's response.
Example Request and Response

```
{
  "userInput": "What is the capital of France?"
}

```

Response:

```
{
  "response": "The capital of France is Paris."
}
```

upload your files to the `data` folder.

You can configure the prompt template and model by modifying the `openai_embedings.js` file.
