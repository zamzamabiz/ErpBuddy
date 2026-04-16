/**
 * DeepSeek AI Service
 * Provides integration with DeepSeek API for AI-powered features
 */

const axios = require('axios');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.model = 'deepseek-chat';
    
    if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
      console.warn('⚠️  DeepSeek API key not configured. Set DEEPSEEK_API_KEY in .env file.');
    }
  }

  /**
   * Create a chat completion using DeepSeek API
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Optional parameters (temperature, max_tokens, etc.)
   * @returns {Promise<Object>} - API response
   */
  async chat(messages, options = {}) {
    if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
      throw new Error('DeepSeek API key is not configured. Please add your API key to .env file.');
    }

    const defaultOptions = {
      model: this.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        config,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 60000 // 60 second timeout
        }
      );

      return {
        success: true,
        data: response.data,
        usage: response.data.usage
      };
    } catch (error) {
      if (error.response) {
        // API returned an error response
        throw new Error(`DeepSeek API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // Request was made but no response
        throw new Error('DeepSeek API: No response received. Please check your network connection.');
      } else {
        // Something else happened
        throw new Error(`DeepSeek API Error: ${error.message}`);
      }
    }
  }

  /**
   * Simple test method to verify API connectivity
   * @returns {Promise<Object>} - Test response
   */
  async test() {
    const testMessages = [
      {
        role: 'user',
        content: 'Respond with "DeepSeek API is working!" if you receive this message.'
      }
    ];

    return await this.chat(testMessages);
  }

  /**
   * Generate text completion for a single prompt
   * @param {string} prompt - The input prompt
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} - API response
   */
  async complete(prompt, options = {}) {
    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.chat(messages, options);
  }
}

module.exports = new DeepSeekService();