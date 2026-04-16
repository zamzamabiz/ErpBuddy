/**
 * DeepSeek AI API Routes
 * Provides endpoints for AI-powered features using DeepSeek API
 */

const express = require('express');
const router = express.Router();
const deepseekService = require('./deepseek.service');

/**
 * @route   POST /api/ai/deepseek/test
 * @desc    Test DeepSeek API connectivity
 * @access  Public
 */
router.post('/test', async (req, res) => {
  try {
    const result = await deepseekService.test();
    
    res.json({
      success: true,
      message: 'DeepSeek API test successful',
      data: result.data,
      usage: result.usage
    });
  } catch (error) {
    console.error('DeepSeek test error:', error.message);
    res.status(500).json({
      success: false,
      message: 'DeepSeek API test failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ai/deepseek/chat
 * @desc    Send chat messages to DeepSeek API
 * @access  Public
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, options } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    const result = await deepseekService.chat(messages, options);
    
    res.json({
      success: true,
      message: 'Chat completion successful',
      data: result.data,
      usage: result.usage
    });
  } catch (error) {
    console.error('DeepSeek chat error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Chat completion failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ai/deepseek/complete
 * @desc    Generate text completion for a single prompt
 * @access  Public
 */
router.post('/complete', async (req, res) => {
  try {
    const { prompt, options } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Prompt string is required'
      });
    }

    const result = await deepseekService.complete(prompt, options);
    
    res.json({
      success: true,
      message: 'Text completion successful',
      data: result.data,
      usage: result.usage
    });
  } catch (error) {
    console.error('DeepSeek completion error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Text completion failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai/deepseek/status
 * @desc    Get DeepSeek API status and configuration
 * @access  Public
 */
router.get('/status', (req, res) => {
  const hasApiKey = deepseekService.apiKey && deepseekService.apiKey !== 'your_deepseek_api_key_here';
  
  res.json({
    success: true,
    message: 'DeepSeek service status',
    data: {
      configured: hasApiKey,
      model: deepseekService.model,
      baseUrl: deepseekService.baseUrl,
      apiKeySet: !!deepseekService.apiKey
    }
  });
});

module.exports = router;