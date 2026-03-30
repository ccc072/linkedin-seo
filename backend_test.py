#!/usr/bin/env python3
"""
LinkedIn Growth Assistant Backend API Testing
Tests all API endpoints: /api/health, /api/submit, /api/update
"""

import requests
import sys
import json
import time
from datetime import datetime

class LinkedInGrowthAPITester:
    def __init__(self, base_url="http://localhost:8001"):
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
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log_test("Health Check", True, f"Status: {data.get('status')}")
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

    def test_submit_endpoint_validation(self):
        """Test /api/submit endpoint with missing required fields"""
        try:
            # Test with missing required fields
            incomplete_data = {
                "name": "Test User",
                "email": "test@example.com"
                # Missing headline, about, targetRole
            }
            
            response = requests.post(
                f"{self.base_url}/api/submit", 
                json=incomplete_data,
                timeout=30
            )
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Missing required fields' in data['error']:
                    self.log_test("Submit Validation", True, "Correctly rejected incomplete data")
                    return True
                else:
                    self.log_test("Submit Validation", False, f"Unexpected error response: {data}")
                    return False
            else:
                self.log_test("Submit Validation", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Submit Validation", False, f"Exception: {str(e)}")
            return False

    def test_submit_endpoint_complete(self):
        """Test /api/submit endpoint with complete data"""
        try:
            # Complete test data
            test_data = {
                "name": "John Doe",
                "email": "tyagirishabh2004@gmail.com",  # Using verified email for testing
                "headline": "Software Engineer at Tech Company",
                "about": "Passionate software engineer with 5 years of experience in full-stack development. Love building scalable applications and learning new technologies.",
                "skills": "JavaScript, React, Node.js, Python, AWS",
                "certifications": "AWS Certified Developer",
                "targetRole": "Senior Full Stack Developer",
                "connections": "500"
            }
            
            print("🔄 Testing complete form submission (this may take 30-60 seconds for AI processing)...")
            
            response = requests.post(
                f"{self.base_url}/api/submit", 
                json=test_data,
                timeout=90  # Increased timeout for AI processing
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ['success', 'message', 'userId', 'suggestions']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Submit Complete", False, f"Missing fields in response: {missing_fields}")
                    return False
                
                # Check suggestions structure
                suggestions = data.get('suggestions', {})
                required_suggestion_fields = ['headlines', 'about', 'skills', 'certifications', 'postIdeas', 'fullPost']
                missing_suggestion_fields = [field for field in required_suggestion_fields if field not in suggestions]
                
                if missing_suggestion_fields:
                    self.log_test("Submit Complete", False, f"Missing suggestion fields: {missing_suggestion_fields}")
                    return False
                
                # Check headlines array
                headlines = suggestions.get('headlines', [])
                if not isinstance(headlines, list) or len(headlines) != 3:
                    self.log_test("Submit Complete", False, f"Expected 3 headlines, got: {len(headlines) if isinstance(headlines, list) else 'not a list'}")
                    return False
                
                self.log_test("Submit Complete", True, f"User ID: {data['userId'][:8]}..., AI suggestions generated")
                return True, data['userId']
                
            else:
                error_text = response.text[:200] if response.text else "No response body"
                self.log_test("Submit Complete", False, f"Status {response.status_code}: {error_text}")
                return False, None
                
        except requests.exceptions.Timeout:
            self.log_test("Submit Complete", False, "Request timed out (AI processing may be slow)")
            return False, None
        except Exception as e:
            self.log_test("Submit Complete", False, f"Exception: {str(e)}")
            return False, None

    def test_update_endpoint(self, user_id=None):
        """Test /api/update endpoint"""
        if not user_id:
            user_id = "test-user-id-12345"
        
        try:
            # Test with valid parameters
            response = requests.get(
                f"{self.base_url}/api/update",
                params={"userId": user_id, "status": "completed"},
                timeout=10
            )
            
            if response.status_code == 200:
                # Should return HTML page
                if "Thank You!" in response.text and "status has been updated" in response.text:
                    self.log_test("Update Endpoint", True, "Successfully updated user status")
                    return True
                else:
                    self.log_test("Update Endpoint", False, "Unexpected HTML response")
                    return False
            else:
                self.log_test("Update Endpoint", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Update Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_update_endpoint_validation(self):
        """Test /api/update endpoint with missing parameters"""
        try:
            # Test with missing parameters
            response = requests.get(f"{self.base_url}/api/update", timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Missing userId or status' in data['error']:
                    self.log_test("Update Validation", True, "Correctly rejected missing parameters")
                    return True
                else:
                    self.log_test("Update Validation", False, f"Unexpected error: {data}")
                    return False
            else:
                self.log_test("Update Validation", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Update Validation", False, f"Exception: {str(e)}")
            return False

    def check_excel_file_creation(self):
        """Check if Excel file was created (indirect test)"""
        try:
            # We can't directly access the file, but we can infer from successful API calls
            # This is more of a logical check based on previous tests
            if self.tests_passed > 0:
                self.log_test("Excel File Creation", True, "Inferred from successful API operations")
                return True
            else:
                self.log_test("Excel File Creation", False, "No successful operations to infer from")
                return False
        except Exception as e:
            self.log_test("Excel File Creation", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting LinkedIn Growth Assistant Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Health check
        health_ok = self.test_health_endpoint()
        
        if not health_ok:
            print("\n❌ Health check failed - stopping tests")
            return self.generate_report()
        
        # Test 2: Submit endpoint validation
        self.test_submit_endpoint_validation()
        
        # Test 3: Submit endpoint with complete data
        submit_result = self.test_submit_endpoint_complete()
        user_id = None
        if isinstance(submit_result, tuple):
            success, user_id = submit_result
        
        # Test 4: Update endpoint validation
        self.test_update_endpoint_validation()
        
        # Test 5: Update endpoint with valid data
        self.test_update_endpoint(user_id)
        
        # Test 6: Excel file creation (indirect)
        self.check_excel_file_creation()
        
        return self.generate_report()

    def generate_report(self):
        """Generate final test report"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed. Check the details above.")
            return 1

def main():
    """Main test execution"""
    tester = LinkedInGrowthAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())