# URLFix Chrome Extension

A Chrome extension that automatically redirects URLs based on configurable regex patterns. Perfect for fixing broken links, redirecting to specific user accounts, suppressing unwanted features, or any other URL transformation needs.

## Features

- **Regex Pattern Matching**: Use full regex patterns to match URLs
- **Capture Groups**: Use capture groups with `$1`, `$2`, etc. in replacements
- **Allow Rules**: Create exceptions to skip redirection for specific patterns
- **Priority System**: Control rule evaluation order (higher priority rules are checked first)
- **Enable/Disable Toggle**: Temporarily disable rules without deleting them
- **Visual Editor**: Easy-to-use card-based UI for managing rules
- **JSON Editor**: Advanced users can edit rules as raw JSON
- **Works Everywhere**: Redirects URLs whether typed in address bar or clicked from links
- **Real-time Updates**: Rules are applied immediately when saved

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use

## Configuration

1. Right-click the extension icon in your Chrome toolbar
2. Click "Options" to open the configuration page
3. Use the visual editor to add, edit, or remove rules
4. Click "Save Rules" to apply your changes

### Rule Fields

| Field | Required | Description |
|-------|----------|-------------|
| `pattern` | Yes | Regex pattern to match URLs |
| `replacement` | For redirects | The replacement URL (use `$1`, `$2`, etc. for capture groups) |
| `action` | No | `"redirect"` (default) or `"allow"` (skip redirection) |
| `priority` | No | Number (default: 1). Higher priority rules are evaluated first |
| `enabled` | No | `true` (default) or `false`. Disabled rules are stored but not applied |

### Rule Format (JSON)

```json
[
  {
    "pattern": "example\\.com/old",
    "replacement": "example.com/new",
    "action": "redirect",
    "priority": 1
  },
  {
    "pattern": "example\\.com/skip-this",
    "action": "allow",
    "priority": 2
  }
]
```

## Example Rules

### Suppress Google AI Overview (Gemini)

Add `-no-ai` to Google searches to disable AI Overview in search results, but only if it's not already present:

```json
[
  {
    "pattern": "google\\.com/search\\?([^#]*&)?q=[^&]*-no-ai",
    "action": "allow",
    "priority": 2
  },
  {
    "pattern": "^(https?://(?:www\\.)?google\\.com/search\\?(?:[^#]*&)?)q=([^&#]*)(.*)$",
    "replacement": "$1q=$2+-no-ai$3",
    "priority": 1
  }
]
```

**How it works:**
1. Rule 1 (priority 2): If the `q=` parameter already contains `-no-ai`, allow the URL through unchanged
2. Rule 2 (priority 1): For all other Google searches, append `+-no-ai` to the query parameter

**Result:**
- `google.com/search?q=hello` → `google.com/search?q=hello+-no-ai`
- `google.com/search?q=hello+-no-ai` → unchanged (rule 1 matches first)
- `google.com/search?q=test&oq=old+-no-ai` → `google.com/search?q=test+-no-ai&oq=old+-no-ai` (only checks `q=` param)

### Google Photos Account Redirect

Redirect Google Photos URLs to use the `/u/0/` path (first account):

```json
[
  {
    "pattern": "photos\\.google\\.com/([^u]|$)",
    "replacement": "photos.google.com/u/0/$1"
  }
]
```

**Result:**
- `photos.google.com/photo` → `photos.google.com/u/0/photo`
- `photos.google.com/album/123` → `photos.google.com/u/0/album/123`

### Simple Domain Redirect

Redirect one domain to another:

```json
[
  {
    "pattern": "old-domain\\.com",
    "replacement": "new-domain.com"
  }
]
```

### Complex URL Transformation

Transform URLs with multiple capture groups:

```json
[
  {
    "pattern": "old-site\\.com/([^/]+)/([^/]+)",
    "replacement": "new-site.com/$2/$1"
  }
]
```

## Tips

### Using Allow Rules for Exceptions

The `allow` action lets you create "unless" conditions:

1. Create an `allow` rule with **higher priority** that matches the exception case
2. Create a `redirect` rule with **lower priority** that matches the general case

The higher-priority `allow` rule will match first and skip redirection for those URLs.

### Regex Pattern Tips

- **Escape special characters**: Use `\\.` for literal dot, `\\?` for literal question mark
- **Capture groups**: Use `(pattern)` to capture, reference with `$1`, `$2`, etc. in replacement
- **Non-capturing groups**: Use `(?:pattern)` to group without capturing
- **Character classes**: Use `[^&#]` to match any character except `&` and `#`
- **Anchors**: Use `^` for start of string, `$` for end of string

### Testing Your Rules

1. Click "Show Active" in the options page to see rules currently active in Chrome
2. Click "JSON" to view/edit rules in raw JSON format
3. Test regex patterns using online regex testers (note: Chrome uses RE2 syntax)
4. Use the enable/disable toggle to test rules without deleting them

## Technical Details

- **Manifest Version**: 3
- **Permissions**: `declarativeNetRequest`, `storage`, `declarativeNetRequestFeedback`
- **Host Permissions**: `<all_urls>`
- **Resource Types**: `main_frame`, `sub_frame`
- **API**: Uses Chrome's `declarativeNetRequest` API for efficient URL redirection
- **Regex Engine**: RE2 (does not support lookaheads/lookbehinds)

## File Structure

```
urlfix/
├── manifest.json          # Extension manifest
├── background.js          # Service worker with rule management
├── options.html           # Configuration page UI
├── options.js             # Configuration page logic
├── icon16.png             # 16x16 extension icon
├── icon32.png             # 32x32 extension icon
├── icon48.png             # 48x48 extension icon
├── icon128.png            # 128x128 extension icon
├── LICENSE                # MIT License
└── README.md              # This file
```

## Contributing

Feel free to submit issues or pull requests to improve this extension!

## License

This project is open source and available under the MIT License.
