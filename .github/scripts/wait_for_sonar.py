"""Wait for SonarQube availability without treating an outage as a passed gate."""

import json
import os
import sys
import time
import urllib.error
import urllib.request


def wait_for_sonar(base_url, attempts=6, delay=10):
    if not base_url or not base_url.startswith(("https://", "http://")):
        print("::error::SONAR_HOST_URL must be an HTTP(S) URL.", flush=True)
        return 1

    url = base_url.rstrip("/") + "/api/system/status"
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                payload = json.load(response)
            status = payload.get("status") if isinstance(payload, dict) else None
            if status == "UP":
                print("SonarQube is UP; starting analysis.", flush=True)
                return 0
            reason = "server is not UP"
        except urllib.error.HTTPError as error:
            # Authentication/configuration errors are not temporary outages.
            error.close()
            if 400 <= error.code < 500 and error.code not in (408, 429):
                print(f"::error::SonarQube readiness returned HTTP {error.code}.", flush=True)
                return 1
            reason = f"HTTP {error.code}"
        except (urllib.error.URLError, TimeoutError, ConnectionError, ValueError):
            # Do not print exception URLs, headers or response bodies.
            reason = "connection failure, timeout or invalid status response"
        print(f"SonarQube unavailable ({attempt}/{attempts}): {reason}.", flush=True)
        if attempt < attempts:
            time.sleep(delay)

    print("::error::SonarQube is unavailable; analysis and Quality Gate were not run.", flush=True)
    return 1


if __name__ == "__main__":
    sys.exit(wait_for_sonar(os.environ.get("SONAR_HOST_URL", "")))
