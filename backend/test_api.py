import os
from dotenv import load_dotenv
import google.generativeai as genai
import sys

# Load env vars
load_dotenv(override=True)

print("--- Gemini API Diagnostic Tool ---")

# 1. Check Key Presence
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("❌ ERROR: GEMINI_API_KEY not found in environment.")
    print("Please make sure you have a .env file in the backend directory with GEMINI_API_KEY=AIza...")
    sys.exit(1)

print(f"✅ API Key found: {api_key[:5]}...{api_key[-3:]}")

# 2. Configure GenAI
try:
    genai.configure(api_key=api_key)
    print("✅ Configuration successful.")
except Exception as e:
    print(f"❌ Configuration failed: {e}")
    sys.exit(1)

# 3. Test Simple Generation
print("\nAttempting basic generation test ('Hello, are you working?')...")
try:
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("Hello, are you working?")
    if response.text:
        print(f"✅ Success! Response: {response.text}")
    else:
        print("⚠️ Response received but empty text.")
except Exception as e:
    print(f"❌ API Call Failed: {e}")
    print("\nPossible causes:")
    print("1. The API Key is invalid or expired.")
    print("2. The API Key does not have the 'Generative Language API' enabled in Google Cloud Console.")
    print("3. Billing is not enabled for this project (though a free tier exists).")
    print("4. Your IP address is blocked.")
