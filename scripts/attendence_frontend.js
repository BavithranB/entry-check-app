// utils/signedRequest.js
// -------------------------------------------------------------
// ✅ This helper securely signs every request to your FastAPI backend.
// -------------------------------------------------------------

import * as Crypto from "expo-crypto";

/**
 * Shared secret key — must be the SAME as APP_SECRET in FastAPI (.env / Railway)
 * DO NOT publish this key to GitHub or share it outside the dev team.
 */
const APP_SECRET = "";  // <-- Replace with real key

/**
 * Create an HMAC-SHA256 signature exactly like backend logic.
 * (Backend computes: HMAC_SHA256(secret, body + timestamp + secret))
 */
async function createSignature(body, timestamp) {
  const message = body + timestamp + APP_SECRET;

  // Using expo-crypto to hash the string with SHA256
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    message
  );

  return hash; // hex string (same as Python's hexdigest)
}

/**
 * Send a signed POST request to your FastAPI endpoint.
 * @param {string} endpoint  Full API URL (e.g. https://your-api.up.railway.app/mark_attendance)
 * @param {object} payload   JSON object to send in body (e.g. { reg_no: "23ECS015" })
 * @returns {Promise<object>} Parsed JSON response from backend
 */
export async function sendSignedPost(endpoint, payload) {
  // 1️⃣ Prepare request body
  const body = JSON.stringify(payload);

  // 2️⃣ Generate timestamp in milliseconds
  const timestamp = Date.now().toString();

  // 3️⃣ Create the signature
  const signature = await createSignature(body, timestamp);

  // 4️⃣ Send request with required headers
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Timestamp": timestamp, // required by backend
      "X-App-Signature": signature, // required by backend
    },
    body,
  });

  // 5️⃣ Parse the JSON response
  const data = await response.json();

  // 6️⃣ Optional error check
  if (!response.ok) {
    console.error("❌ Backend returned error:", data);
    throw new Error(data.detail || "Request failed");
  }

  return data;
}
