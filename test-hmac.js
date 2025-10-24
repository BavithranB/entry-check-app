/**
 * Test script to verify HMAC implementation
 * Run with: node test-hmac.js
 */

const crypto = require('crypto');
const CryptoJS = require('crypto-js');

const APP_SECRET = "cdb8d7497b34a314db76dd832803b393f6f4ef0dfa2a1dd230a7c8b32d600fb9";
const body = "";  // Empty for GET request
const timestamp = "1761317199187";  // Example from your request

// Python backend does:
// hmac.new(APP_SECRET.encode(), (body + timestamp + APP_SECRET).encode(), hashlib.sha256).hexdigest()

const message = body + timestamp + APP_SECRET;

// Node.js crypto (should match Python)
const hmacNode = crypto.createHmac('sha256', APP_SECRET);
hmacNode.update(message);
const signatureNode = hmacNode.digest('hex');

// crypto-js (what React Native will use)
const hmacJS = CryptoJS.HmacSHA256(message, APP_SECRET);
const signatureJS = hmacJS.toString(CryptoJS.enc.Hex);

console.log('='.repeat(60));
console.log('HMAC-SHA256 Test');
console.log('='.repeat(60));
console.log('APP_SECRET:', APP_SECRET);
console.log('Body:', JSON.stringify(body));
console.log('Timestamp:', timestamp);
console.log('Message (body + timestamp + secret):', message.substring(0, 100) + '...');
console.log('\nNode.js crypto signature:', signatureNode);
console.log('crypto-js signature:      ', signatureJS);
console.log('Match:', signatureNode === signatureJS ? '✅ YES' : '❌ NO');
console.log('='.repeat(60));
console.log('\nYour frontend sent:', '267c96d080f2c94986da8be98bbc6f9a940a60b32e3873bd2bb815da5eee1c58');
console.log('Should have sent:  ', signatureJS);
console.log('Match:', signatureJS === '267c96d080f2c94986da8be98bbc6f9a940a60b32e3873bd2bb815da5eee1c58' ? '✅ YES' : '❌ NO');
