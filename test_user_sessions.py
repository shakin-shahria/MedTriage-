#!/usr/bin/env python3
"""
Test script to verify that user sessions are properly tracked in the profile.
"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_user_sessions():
    print("🧪 Testing user session tracking...")

    # Step 1: Register a test user
    print("1. Registering test user...")
    register_data = {
        "username": "testuser123",
        "email": "test@example.com",
        "password": "testpass123"
    }
    register_response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"   Register response: {register_response.status_code}")
    if register_response.status_code != 200:
        print(f"   Error: {register_response.text}")
        return

    # Step 2: Login to get token
    print("2. Logging in...")
    login_data = {
        "username_or_email": "testuser123",
        "password": "testpass123"
    }
    login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"   Login response: {login_response.status_code}")
    if login_response.status_code != 200:
        print(f"   Error: {login_response.text}")
        return

    token_data = login_response.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"   Got token: {token[:20]}...")

    # Step 3: Check initial sessions (should be empty)
    print("3. Checking initial sessions...")
    sessions_response = requests.get(f"{BASE_URL}/auth/sessions", headers=headers)
    print(f"   Sessions response: {sessions_response.status_code}")
    initial_sessions = sessions_response.json()
    print(f"   Initial sessions count: {len(initial_sessions)}")

    # Step 4: Take an assessment
    print("4. Taking assessment...")
    triage_data = {
        "symptom": "I have a severe headache and feel dizzy"
    }
    triage_response = requests.post(f"{BASE_URL}/triage", json=triage_data, headers=headers)
    print(f"   Triage response: {triage_response.status_code}")
    if triage_response.status_code == 200:
        result = triage_response.json()
        print(f"   Assessment result: {result['risk']} risk")

    # Step 5: Check sessions again (should now have 1 session)
    print("5. Checking sessions after assessment...")
    time.sleep(1)  # Small delay to ensure DB commit
    sessions_response = requests.get(f"{BASE_URL}/auth/sessions", headers=headers)
    print(f"   Sessions response: {sessions_response.status_code}")
    final_sessions = sessions_response.json()
    print(f"   Final sessions count: {len(final_sessions)}")

    if len(final_sessions) > len(initial_sessions):
        print("✅ SUCCESS: Session was properly associated with user!")
        session = final_sessions[0]
        print(f"   Session details: risk_level={session['risk_level']}, created_at={session['created_at']}")
    else:
        print("❌ FAILED: Session was not associated with user")

    # Step 6: Test anonymous assessment (without token)
    print("6. Testing anonymous assessment...")
    anon_response = requests.post(f"{BASE_URL}/triage", json={"symptom": "I have a mild cough"})
    print(f"   Anonymous triage response: {anon_response.status_code}")

    # Step 7: Verify anonymous session doesn't appear in user sessions
    print("7. Verifying anonymous session doesn't appear in user profile...")
    sessions_response = requests.get(f"{BASE_URL}/auth/sessions", headers=headers)
    user_sessions = sessions_response.json()
    print(f"   User sessions count after anonymous triage: {len(user_sessions)}")

    if len(user_sessions) == len(final_sessions):
        print("✅ SUCCESS: Anonymous sessions are not mixed with user sessions")
    else:
        print("❌ FAILED: Anonymous sessions are appearing in user profile")

if __name__ == "__main__":
    test_user_sessions()