"""
Test script to verify API endpoints.
Run this after starting the Django server.
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def print_response(response):
    """Pretty print response."""
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
    print("-" * 80)

def test_register():
    """Test user registration."""
    print("\n=== Testing Registration ===")
    data = {
        "email": "test@example.com",
        "phone": "+8801712345678",
        "password": "TestPass123!",
        "password_confirm": "TestPass123!",
        "role": "CITIZEN"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    print_response(response)
    return response.json() if response.status_code == 201 else None

def test_login():
    """Test user login."""
    print("\n=== Testing Login ===")
    data = {
        "email": "test@example.com",
        "password": "TestPass123!"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    print_response(response)
    return response.json() if response.status_code == 200 else None

def test_get_current_user(token):
    """Test get current user."""
    print("\n=== Testing Get Current User ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print_response(response)

def test_create_enrollment(token):
    """Test create enrollment case."""
    print("\n=== Testing Create Enrollment ===")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "nid_number": "1234567890123",
        "full_name": "Ahmed Rahman",
        "date_of_birth": "1990-01-15",
        "residency_district": "Dhaka"
    }
    response = requests.post(f"{BASE_URL}/enrollment/cases/create", json=data, headers=headers)
    print_response(response)

def test_list_enrollments(token):
    """Test list enrollment cases."""
    print("\n=== Testing List Enrollments ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/enrollment/cases", headers=headers)
    print_response(response)

def test_list_organizations(token):
    """Test list organizations."""
    print("\n=== Testing List Organizations ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/organizations", headers=headers)
    print_response(response)

if __name__ == "__main__":
    print("=" * 80)
    print("Identity Shield - API Test Suite")
    print("=" * 80)
    
    # Test registration
    register_result = test_register()
    
    if register_result:
        token = register_result['tokens']['access']
        
        # Test authenticated endpoints
        test_get_current_user(token)
        test_create_enrollment(token)
        test_list_enrollments(token)
        test_list_organizations(token)
    else:
        # Try login if registration failed (user might already exist)
        login_result = test_login()
        if login_result:
            token = login_result['tokens']['access']
            test_get_current_user(token)
            test_create_enrollment(token)
            test_list_enrollments(token)
            test_list_organizations(token)
    
    print("\n" + "=" * 80)
    print("Test suite completed!")
    print("=" * 80)
