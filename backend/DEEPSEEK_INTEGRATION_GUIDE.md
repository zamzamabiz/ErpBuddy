# DeepSeek API Integration Guide

This guide explains how to configure and use the DeepSeek API integration in your ErpBuddy backend.

## 📋 Overview

The DeepSeek API integration provides AI-powered capabilities to your ERP system through a simple REST API interface.

## 🔧 Setup Instructions

### 1. Get Your DeepSeek API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key

### 2. Configure Your Environment

Edit the `backend/.env` file and add your API key:

```env
DEEPSEEK_API_KEY=sk_your_actual_api_key_here
```

**Important**: Never commit your actual API key to version control!

### 3. Test the Integration

Run the test script to verify your setup:

```bash
cd backend
node test-deepseek.js
```

If successful, you'll see a response from the DeepSeek API.

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api/ai/deepseek
```

### Available Endpoints

#### 1. Test API Connection
```http
POST /api/ai/deepseek/test
```

**Response:**
```json
{
  "success": true,
  "message": "DeepSeek API test successful",
  "data": { ... },
  "usage": { ... }
}
```

#### 2. Chat Completion
```http
POST /api/ai/deepseek/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat completion successful",
  "data": {
    "id": "chatcmpl-...",
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "Hello! I'm doing well, thank you for asking..."
        },
        "finish_reason": "stop",
        "index": 0
      }
    ],
    "usage": {
      "prompt_tokens": 10,
      "completion_tokens": 25,
      "total_tokens": 35
    }
  }
}
```

#### 3. Text Completion
```http
POST /api/ai/deepseek/complete
Content-Type: application/json

{
  "prompt": "Explain what artificial intelligence is in simple terms.",
  "options": {
    "temperature": 0.5,
    "max_tokens": 500
  }
}
```

#### 4. Get Service Status
```http
GET /api/ai/deepseek/status
```

**Response:**
```json
{
  "success": true,
  "message": "DeepSeek service status",
  "data": {
    "configured": true,
    "model": "deepseek-chat",
    "baseUrl": "https://api.deepseek.com/v1",
    "apiKeySet": true
  }
}
```

## 💡 Usage Examples

### Example 1: Simple Chat Request

```javascript
const response = await fetch('http://localhost:5000/api/ai/deepseek/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'What is 2 + 2?'
      }
    ]
  })
});

const data = await response.json();
console.log(data.data.choices[0].message.content);
```

### Example 2: Multi-turn Conversation

```javascript
const messages = [
  {
    role: 'user',
    content: 'What is the capital of France?'
  },
  {
    role: 'assistant',
    content: 'The capital of France is Paris.'
  },
  {
    role: 'user',
    content: 'What is its population?'
  }
];

const response = await fetch('http://localhost:5000/api/ai/deepseek/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ messages })
});

const data = await response.json();
console.log(data.data.choices[0].message.content);
```

### Example 3: Using in Your Backend Code

```javascript
const deepseekService = require('./src/modules/ai/deepseek.service');

// In your route or service
async function generateInvoiceSummary(invoiceData) {
  const prompt = `Summarize this invoice data: ${JSON.stringify(invoiceData)}`;
  
  try {
    const result = await deepseekService.complete(prompt);
    return result.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating summary:', error.message);
    throw error;
  }
}
```

## 🔒 Security Considerations

1. **API Key Protection**: Keep your API key secure and never expose it in frontend code
2. **Rate Limiting**: Consider implementing rate limiting for AI endpoints
3. **Input Validation**: Always validate and sanitize user input before sending to AI
4. **Cost Monitoring**: Monitor your API usage to avoid unexpected costs

## 🚨 Troubleshooting

### Error: "DeepSeek API key is not configured"
- Check that `DEEPSEEK_API_KEY` is set in your `.env` file
- Restart your server after updating the `.env` file
- Ensure there are no extra spaces or quotes around the key

### Error: "No response received"
- Check your internet connection
- Verify the DeepSeek API is accessible from your network
- Check if your API key is valid

### Error: "API Error: 401"
- Your API key may be invalid or expired
- Regenerate your API key from the DeepSeek platform

## 📚 Additional Resources

- [DeepSeek API Documentation](https://platform.deepseek.com/api-docs/)
- [DeepSeek Models](https://platform.deepseek.com/docs/models)
- [Pricing Information](https://platform.deepseek.com/pricing)

## 🆘 Support

If you encounter any issues:
1. Check the error logs in your terminal
2. Verify your API key is correct
3. Test using the `test-deepseek.js` script
4. Consult the DeepSeek API documentation

---

**Created**: 2026-04-16  
**Version**: 1.0.0  
**Integration**: ErpBuddy Backend