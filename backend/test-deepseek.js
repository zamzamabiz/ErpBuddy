/**
 * Test script for DeepSeek API integration
 * Run with: node test-deepseek.js
 */

require('dotenv').config({ path: './.env' });
const deepseekService = require('./src/modules/ai/deepseek.service');

async function testDeepSeekAPI() {
  console.log('🔍 Testing DeepSeek API Integration...\n');
  
  // Check if API key is configured
  if (!deepseekService.apiKey || deepseekService.apiKey === 'your_deepseek_api_key_here') {
    console.log('❌ DeepSeek API key is NOT configured');
    console.log('📝 Please add your API key to .env file:');
    console.log('   DEEPSEEK_API_KEY=your_actual_api_key_here\n');
    return;
  }
  
  console.log('✅ DeepSeek API key is configured');
  console.log(`📋 Model: ${deepseekService.model}`);
  console.log(`🔗 Base URL: ${deepseekService.baseUrl}\n`);
  
  try {
    console.log('🚀 Running test request...\n');
    
    const result = await deepseekService.test();
    
    console.log('✅ Test successful!\n');
    console.log('📊 Response:');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('\n📊 Usage:');
    console.log(JSON.stringify(result.usage, null, 2));
    
  } catch (error) {
    console.log('❌ Test failed!');
    console.log(`Error: ${error.message}`);
  }
}

// Run the test
testDeepSeekAPI();