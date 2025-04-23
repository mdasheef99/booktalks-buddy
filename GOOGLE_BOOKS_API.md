# Setting Up Google Books API Key

This application uses the Google Books API to search for and display book information. To avoid rate limiting errors (429 Too Many Requests), you should set up your own Google Books API key.

## Getting a Google Books API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the Google Books API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Books API"
   - Click on "Google Books API"
   - Click "Enable"
4. Create an API key:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API key"
   - Copy your new API key

## Adding the API Key to Your Project

1. Create a `.env` file in the root of your project (if it doesn't exist already)
2. Add the following line to your `.env` file:
   ```
   VITE_GOOGLE_BOOKS_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with the API key you obtained from Google Cloud Console
4. Restart your development server

## API Key Security

- The API key is used only on the client side for this application
- For production, consider implementing API key restrictions in the Google Cloud Console:
  - Restrict the key to only the Google Books API
  - Set HTTP referrer restrictions to only allow requests from your domain

## Fallback Behavior

If the API key is not provided or if the API requests still fail, the application will fall back to using local sample data. This ensures that the application remains functional even without API access, but with limited book selection.

## Rate Limits

With an API key, Google Books API provides a higher rate limit (typically 1,000 queries per day), which should be sufficient for development and moderate usage. Without an API key, the limit is much lower and can be quickly exhausted.
