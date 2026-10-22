"""
Selenium WebDriver tests for the web version of the Smart Study News Notification App.

NOTE: BASE_URL and every element locator (By.ID values) below are PLACEHOLDERS.
Replace them with the real URL and element ids of your web interface before running.
"""
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"      # placeholder
VALID_EMAIL = "sneha.minhas@mail.com"
VALID_PASSWORD = "Study@123"
WRONG_PASSWORD = "wrongPass1"


class SmartStudyAppTests(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Chrome()          # Selenium 4 downloads the driver automatically
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get(BASE_URL + "/login")

    def tearDown(self):
        self.driver.quit()

    def login(self, email, password):
        self.driver.find_element(By.ID, "email").send_keys(email)
        self.driver.find_element(By.ID, "password").send_keys(password)
        self.driver.find_element(By.ID, "loginBtn").click()

    # TU01 - valid login
    def test_TU01_valid_login(self):
        self.login(VALID_EMAIL, VALID_PASSWORD)
        self.wait.until(EC.url_contains("/subjects"))
        self.assertIn("/subjects", self.driver.current_url)

    # TU02 - invalid login
    def test_TU02_invalid_login(self):
        self.login(VALID_EMAIL, WRONG_PASSWORD)
        error = self.wait.until(EC.visibility_of_element_located((By.ID, "errorMsg")))
        self.assertIn("invalid", error.text.lower())
        self.assertIn("/login", self.driver.current_url)

    # TU05 - empty email
    def test_TU05_empty_email(self):
        self.login("", VALID_PASSWORD)
        error = self.wait.until(EC.visibility_of_element_located((By.ID, "errorMsg")))
        self.assertTrue(error.is_displayed())

    # TU06 - select a subject and topic, then save
    def test_TU06_select_subject_and_topic(self):
        self.login(VALID_EMAIL, VALID_PASSWORD)
        self.wait.until(EC.element_to_be_clickable((By.ID, "subject-S01"))).click()   # Computer Networks
        self.wait.until(EC.element_to_be_clickable((By.ID, "topic-T01"))).click()     # OSI Model
        self.driver.find_element(By.ID, "saveBtn").click()
        toast = self.wait.until(EC.visibility_of_element_located((By.ID, "successToast")))
        self.assertIn("saved", toast.text.lower())


if __name__ == "__main__":
    unittest.main(verbosity=2)
