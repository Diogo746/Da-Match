import io
import unittest
import urllib.error
from unittest.mock import patch

from wait_for_sonar import wait_for_sonar


def status_response(status):
    return io.BytesIO((' {"status": "' + status + '"}').encode())


class WaitForSonarTest(unittest.TestCase):
    def setUp(self):
        self.output = io.StringIO()
        self.addCleanup(patch.stopall)
        patch("sys.stdout", self.output).start()
        self.open = patch("wait_for_sonar.urllib.request.urlopen").start()
        self.sleep = patch("wait_for_sonar.time.sleep").start()

    def test_up_starts_without_retry(self):
        self.open.return_value = status_response("UP")
        self.assertEqual(wait_for_sonar("https://sonar.example/"), 0)
        self.open.assert_called_once_with("https://sonar.example/api/system/status", timeout=15)
        self.sleep.assert_not_called()

    def test_recovers_after_connection_failure_and_restart(self):
        self.open.side_effect = [
            urllib.error.URLError("connection reset"),
            status_response("STARTING"),
            status_response("UP"),
        ]
        self.assertEqual(wait_for_sonar("https://sonar.example"), 0)
        self.assertEqual(self.sleep.call_count, 2)

    def test_persistent_outage_fails_without_leaking_url(self):
        self.open.side_effect = TimeoutError("https://private.example?secret=value")
        self.assertEqual(wait_for_sonar("https://sonar.example"), 1)
        self.assertEqual(self.open.call_count, 6)
        self.assertEqual(self.sleep.call_count, 5)
        self.assertNotIn("secret=value", self.output.getvalue())
        self.assertIn("Quality Gate were not run", self.output.getvalue())

    def test_transient_http_errors_are_retried(self):
        for code in (408, 429, 502, 503):
            with self.subTest(code=code):
                self.open.side_effect = [
                    urllib.error.HTTPError("url", code, "error", None, None),
                    status_response("UP"),
                ]
                self.assertEqual(wait_for_sonar("https://sonar.example"), 0)

    def test_authentication_errors_fail_immediately(self):
        for code in (401, 403, 404):
            with self.subTest(code=code):
                self.open.reset_mock()
                self.open.side_effect = urllib.error.HTTPError("url", code, "error", None, None)
                self.assertEqual(wait_for_sonar("https://sonar.example"), 1)
                self.open.assert_called_once()
        self.sleep.assert_not_called()

    def test_invalid_response_is_retried(self):
        for payload in (b"not json", b"[]", b"{}"):
            with self.subTest(payload=payload):
                self.open.side_effect = [io.BytesIO(payload), status_response("UP")]
                self.assertEqual(wait_for_sonar("https://sonar.example"), 0)

    def test_missing_or_invalid_url_fails_without_network(self):
        for url in ("", "file:///tmp/status"):
            with self.subTest(url=url):
                self.assertEqual(wait_for_sonar(url), 1)
        self.open.assert_not_called()


if __name__ == "__main__":
    unittest.main()
