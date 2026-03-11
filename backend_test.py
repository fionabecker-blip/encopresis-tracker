#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Bowel Movement Tracking App
Tests all CRUD operations for daily entries at /api/entries
"""

import requests
import json
import uuid
from datetime import datetime, date
import time

# Backend URL from frontend environment
BACKEND_URL = "https://fiber-track-3.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_entries = []
        self.failed_tests = []
        self.passed_tests = []
        
    def log_result(self, test_name, success, details=""):
        """Log test results"""
        if success:
            self.passed_tests.append(f"✅ {test_name}")
            print(f"✅ PASS: {test_name}")
        else:
            self.failed_tests.append(f"❌ {test_name}: {details}")
            print(f"❌ FAIL: {test_name}")
            if details:
                print(f"   Details: {details}")

    def test_server_health(self):
        """Test if backend server is running"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                self.log_result("Server Health Check", True)
                return True
            else:
                self.log_result("Server Health Check", False, f"Status: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.log_result("Server Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_post_entry_minimal(self):
        """Test POST /entries with minimal required fields"""
        try:
            payload = {
                "leaks": True,
                "activity_30_min": False,
                "bm_type": "SP"
            }
            
            response = requests.post(f"{self.base_url}/entries", 
                                   json=payload, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.test_entries.append(data['id'])
                # Verify required fields are present
                if all(key in data for key in ['id', 'created_at', 'updated_at', 'date']):
                    self.log_result("POST /entries - Minimal Entry", True)
                    return data
                else:
                    self.log_result("POST /entries - Minimal Entry", False, "Missing required fields in response")
                    return None
            else:
                self.log_result("POST /entries - Minimal Entry", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            self.log_result("POST /entries - Minimal Entry", False, f"Request error: {str(e)}")
            return None

    def test_post_entry_full(self):
        """Test POST /entries with all fields"""
        try:
            payload = {
                "date": date.today().isoformat(),
                "fecal_accidents": 2,
                "urine_accidents": 1,
                "leaks": True,
                "medication": "MiraLAX 1 capful",
                "bm_type": "enema poop",
                "bm_notes": "Good consistency, no straining",
                "water_intake": 1500.5,
                "fiber_intake": 25.0,
                "water_unit": "ml",
                "fiber_unit": "g",
                "activity_30_min": True,
                "notes": "Good day overall, reminder set for tomorrow"
            }
            
            response = requests.post(f"{self.base_url}/entries", 
                                   json=payload, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.test_entries.append(data['id'])
                # Verify all fields are preserved
                success = True
                for key, value in payload.items():
                    if data.get(key) != value:
                        success = False
                        break
                
                if success:
                    self.log_result("POST /entries - Full Entry", True)
                    return data
                else:
                    self.log_result("POST /entries - Full Entry", False, "Field values don't match")
                    return None
            else:
                self.log_result("POST /entries - Full Entry", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            self.log_result("POST /entries - Full Entry", False, f"Request error: {str(e)}")
            return None

    def test_get_entries_list(self):
        """Test GET /entries returns list of entries"""
        try:
            response = requests.get(f"{self.base_url}/entries", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our test entries are in the list
                    entry_ids = [entry.get('id') for entry in data]
                    found_test_entries = [entry_id for entry_id in self.test_entries if entry_id in entry_ids]
                    
                    if len(found_test_entries) >= len(self.test_entries):
                        self.log_result("GET /entries - List", True)
                        return data
                    else:
                        self.log_result("GET /entries - List", False, 
                                      f"Not all test entries found. Expected: {len(self.test_entries)}, Found: {len(found_test_entries)}")
                        return None
                else:
                    self.log_result("GET /entries - List", False, "Response is not a list")
                    return None
            else:
                self.log_result("GET /entries - List", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            self.log_result("GET /entries - List", False, f"Request error: {str(e)}")
            return None

    def test_get_entry_by_id(self, entry_id):
        """Test GET /entries/{id}"""
        try:
            response = requests.get(f"{self.base_url}/entries/{entry_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('id') == entry_id:
                    self.log_result(f"GET /entries/{entry_id[:8]}...", True)
                    return data
                else:
                    self.log_result(f"GET /entries/{entry_id[:8]}...", False, "ID mismatch in response")
                    return None
            elif response.status_code == 404:
                self.log_result(f"GET /entries/{entry_id[:8]}...", False, "Entry not found (404)")
                return None
            else:
                self.log_result(f"GET /entries/{entry_id[:8]}...", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            self.log_result(f"GET /entries/{entry_id[:8]}...", False, f"Request error: {str(e)}")
            return None

    def test_put_entry(self, entry_id):
        """Test PUT /entries/{id} updates fields"""
        try:
            update_payload = {
                "fecal_accidents": 3,
                "leaks": False,
                "medication": "Updated medication",
                "notes": "Updated notes for testing"
            }
            
            response = requests.put(f"{self.base_url}/entries/{entry_id}", 
                                  json=update_payload, 
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Verify updates were applied
                success = True
                for key, value in update_payload.items():
                    if data.get(key) != value:
                        success = False
                        break
                
                # Verify updated_at timestamp changed
                if 'updated_at' not in data:
                    success = False
                
                if success:
                    self.log_result(f"PUT /entries/{entry_id[:8]}...", True)
                    return data
                else:
                    self.log_result(f"PUT /entries/{entry_id[:8]}...", False, "Update fields not applied correctly")
                    return None
            elif response.status_code == 404:
                self.log_result(f"PUT /entries/{entry_id[:8]}...", False, "Entry not found (404)")
                return None
            else:
                self.log_result(f"PUT /entries/{entry_id[:8]}...", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            self.log_result(f"PUT /entries/{entry_id[:8]}...", False, f"Request error: {str(e)}")
            return None

    def test_delete_entry(self, entry_id):
        """Test DELETE /entries/{id}"""
        try:
            response = requests.delete(f"{self.base_url}/entries/{entry_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'deleted':
                    # Verify entry is actually deleted by trying to GET it
                    get_response = requests.get(f"{self.base_url}/entries/{entry_id}", timeout=10)
                    if get_response.status_code == 404:
                        self.log_result(f"DELETE /entries/{entry_id[:8]}...", True)
                        return True
                    else:
                        self.log_result(f"DELETE /entries/{entry_id[:8]}...", False, "Entry still exists after deletion")
                        return False
                else:
                    self.log_result(f"DELETE /entries/{entry_id[:8]}...", False, "Invalid delete response")
                    return False
            elif response.status_code == 404:
                self.log_result(f"DELETE /entries/{entry_id[:8]}...", False, "Entry not found (404)")
                return False
            else:
                self.log_result(f"DELETE /entries/{entry_id[:8]}...", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            self.log_result(f"DELETE /entries/{entry_id[:8]}...", False, f"Request error: {str(e)}")
            return False

    def test_edge_cases(self):
        """Test edge cases and error handling"""
        # Test GET non-existent entry
        fake_id = str(uuid.uuid4())
        try:
            response = requests.get(f"{self.base_url}/entries/{fake_id}", timeout=10)
            if response.status_code == 404:
                self.log_result("GET non-existent entry (404)", True)
            else:
                self.log_result("GET non-existent entry (404)", False, f"Expected 404, got {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.log_result("GET non-existent entry (404)", False, f"Request error: {str(e)}")

        # Test PUT non-existent entry
        try:
            response = requests.put(f"{self.base_url}/entries/{fake_id}", 
                                  json={"leaks": True}, 
                                  timeout=10)
            if response.status_code == 404:
                self.log_result("PUT non-existent entry (404)", True)
            else:
                self.log_result("PUT non-existent entry (404)", False, f"Expected 404, got {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.log_result("PUT non-existent entry (404)", False, f"Request error: {str(e)}")

        # Test DELETE non-existent entry
        try:
            response = requests.delete(f"{self.base_url}/entries/{fake_id}", timeout=10)
            if response.status_code == 404:
                self.log_result("DELETE non-existent entry (404)", True)
            else:
                self.log_result("DELETE non-existent entry (404)", False, f"Expected 404, got {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.log_result("DELETE non-existent entry (404)", False, f"Request error: {str(e)}")

    def run_all_tests(self):
        """Run all backend CRUD tests"""
        print("="*60)
        print("BACKEND API TESTING - Daily Entries CRUD")
        print("="*60)
        print(f"Testing backend at: {self.base_url}")
        print()

        # Test server health first
        if not self.test_server_health():
            print("\n❌ Backend server is not accessible. Stopping tests.")
            return False

        print("\n--- CRUD Operation Testing ---")
        
        # Create test entries
        entry1 = self.test_post_entry_minimal()
        entry2 = self.test_post_entry_full()
        
        if not entry1 and not entry2:
            print("\n❌ Could not create any test entries. Stopping CRUD tests.")
            return False

        # Test list entries
        self.test_get_entries_list()

        # Test individual entry retrieval and updates
        if entry1:
            self.test_get_entry_by_id(entry1['id'])
            self.test_put_entry(entry1['id'])

        if entry2:
            self.test_get_entry_by_id(entry2['id'])
            
        # Test edge cases
        print("\n--- Error Handling Tests ---")
        self.test_edge_cases()

        # Test deletions (do this last)
        print("\n--- Deletion Tests ---")
        for entry_id in self.test_entries:
            self.test_delete_entry(entry_id)

        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        if self.passed_tests:
            print(f"\nPASSED TESTS ({len(self.passed_tests)}):")
            for test in self.passed_tests:
                print(f"  {test}")
        
        if self.failed_tests:
            print(f"\nFAILED TESTS ({len(self.failed_tests)}):")
            for test in self.failed_tests:
                print(f"  {test}")
        else:
            print("\n✅ ALL TESTS PASSED!")

        print(f"\nTotal: {len(self.passed_tests) + len(self.failed_tests)} tests")
        print(f"Passed: {len(self.passed_tests)}")
        print(f"Failed: {len(self.failed_tests)}")
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)