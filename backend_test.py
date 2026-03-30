#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class LinkedInGrowthAPITester:
    def __init__(self, base_url="https://profile-optimizer-17.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_health_endpoint(self):
        """Test GET /api/health"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log_test("Health Check", True)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_submit_valid_data(self):
        """Test POST /api/submit with valid data"""
        valid_data = {
            "name": "John Doe",
            "email": "tyagirishabh2004@gmail.com",  # Use verified email
            "headline": "Software Engineer at Tech Company",
            "about": "Passionate software engineer with 5 years of experience in full-stack development.",
            "skills": "JavaScript, React, Node.js, Python",
            "certifications": "AWS Certified Developer",
            "targetRole": "Senior Full Stack Developer",
            "connections": "500"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/submit", 
                json=valid_data,
                headers={'Content-Type': 'application/json'},
                timeout=30  # AI calls can take time
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get('success') and 
                    data.get('userId') and 
                    data.get('suggestions')):
                    
                    # Check if suggestions have expected structure
                    suggestions = data.get('suggestions', {})
                    required_keys = ['headlines', 'about', 'skills', 'certifications', 'postIdeas', 'fullPost']
                    
                    missing_keys = [key for key in required_keys if key not in suggestions]
                    if not missing_keys:
                        self.log_test("Submit Valid Data", True)
                        return True, data.get('userId')
                    else:
                        self.log_test("Submit Valid Data", False, f"Missing suggestion keys: {missing_keys}")
                        return False, None
                else:
                    self.log_test("Submit Valid Data", False, f"Missing required fields in response: {data}")
                    return False, None
            else:
                self.log_test("Submit Valid Data", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False, None
                
        except Exception as e:
            self.log_test("Submit Valid Data", False, f"Exception: {str(e)}")
            return False, None

    def test_submit_missing_fields(self):
        """Test POST /api/submit with missing required fields"""
        invalid_data = {
            "name": "John Doe",
            "email": "john.doe@example.com"
            # Missing required fields: headline, about, targetRole
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/submit", 
                json=invalid_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Missing required fields' in data['error']:
                    self.log_test("Submit Missing Fields", True)
                    return True
                else:
                    self.log_test("Submit Missing Fields", False, f"Unexpected error message: {data}")
                    return False
            else:
                self.log_test("Submit Missing Fields", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Submit Missing Fields", False, f"Exception: {str(e)}")
            return False

    def test_update_with_params(self, user_id=None):
        """Test GET /api/update with valid parameters"""
        if not user_id:
            user_id = "test-user-id"
        
        try:
            response = requests.get(
                f"{self.base_url}/api/update?userId={user_id}&status=completed",
                timeout=10
            )
            
            if response.status_code == 200:
                # Should return HTML content
                content = response.text
                if ('<!DOCTYPE html>' in content and 
                    'Thank You!' in content and 
                    'Congratulations on completing' in content):
                    self.log_test("Update With Params", True)
                    return True
                else:
                    self.log_test("Update With Params", False, f"Unexpected HTML content")
                    return False
            else:
                self.log_test("Update With Params", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Update With Params", False, f"Exception: {str(e)}")
            return False

    def test_update_without_params(self):
        """Test GET /api/update without required parameters"""
        try:
            response = requests.get(f"{self.base_url}/api/update", timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Missing userId or status' in data['error']:
                    self.log_test("Update Without Params", True)
                    return True
                else:
                    self.log_test("Update Without Params", False, f"Unexpected error: {data}")
                    return False
            else:
                self.log_test("Update Without Params", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Update Without Params", False, f"Exception: {str(e)}")
            return False

    def test_cron_reminder(self):
        """Test GET /api/cron/reminder"""
        try:
            response = requests.get(f"{self.base_url}/api/cron/reminder", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'remindersSent' in data:
                    self.log_test("Cron Reminder", True)
                    return True
                else:
                    self.log_test("Cron Reminder", False, f"Unexpected response structure: {data}")
                    return False
            else:
                self.log_test("Cron Reminder", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Cron Reminder", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"🚀 Starting LinkedIn Growth Assistant API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Health check
        health_ok = self.test_health_endpoint()
        
        # Test 2: Submit with valid data (this tests AI integration, Excel storage, email sending)
        submit_ok, user_id = self.test_submit_valid_data()
        
        # Test 3: Submit with missing fields
        self.test_submit_missing_fields()
        
        # Test 4: Update with parameters (use real user_id if available)
        self.test_update_with_params(user_id)
        
        # Test 5: Update without parameters
        self.test_update_without_params()
        
        # Test 6: Cron reminder
        self.test_cron_reminder()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = LinkedInGrowthAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())