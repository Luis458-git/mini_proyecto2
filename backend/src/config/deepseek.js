const path = require('path');
const OpenAI = require('openai');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

/**
 * Cliente OpenAI configurado para interactuar con DeepSeek.
 */
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy_key',
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
});

const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const REASONER_MODEL = process.env.DEEPSEEK_REASONER_MODEL || 'deepseek-reasoner';

module.exports = {
  deepseek,
  DEFAULT_MODEL,
  REASONER_MODEL,
};
