"""Print the API's OpenAPI schema as JSON, for scripts/types.mjs (no server needed)."""

import json
import sys

from accountable.main import app


def main() -> None:
    sys.stdout.write(json.dumps(app.openapi(), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
