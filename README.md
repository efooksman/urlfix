# URLFix Chrome Extension

A Chrome extension that automatically redirects URLs based on configurable regex patterns. Perfect for fixing broken links, redirecting to specific user accounts, or any other URL transformation needs.

## Features

- **Regex Pattern Matching**: Use full regex patterns to match URLs
- **Capture Groups**: Use capture groups with `$1`, `$2`, etc. in replacements
- **Works Everywhere**: Redirects URLs whether typed in address bar or clicked from links
- **Easy Configuration**: Simple JSON-based rule configuration
- **Real-time Updates**: Rules are applied immediately when saved

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use

## Configuration

1. Click the extension icon in your Chrome toolbar
2. Click "Options" to open the configuration page
3. Edit the rules in the textarea using JSON format
4. Click "Save" to apply the rules

### Rule Format

Each rule consists of two parts:
- `pattern`: A regex pattern to match URLs
- `replacement`: The replacement URL (use `$1`, `$2`, etc. for capture groups)

```json
[
  {
    "pattern": "photos\\.google\\.com/([^u]|$)",
    "replacement": "photos.google.com/u/0/$1"
  }
]
```

## Example Rules

### Google Photos Redirect

Redirects Google Photos URLs to use the `/u/0/` path:

```json
[
  {
    "pattern": "photos\\.google\\.com/([^u]|$)",
    "replacement": "photos.google.com/u/0/$1"
  }
]
```

**What it does:**
- `photos.google.com/photo` → `photos.google.com/u/0/photo`
- `photos.google.com/album/123` → `photos.google.com/u/0/album/123`
- `photos.google.com/` → `photos.google.com/u/0/`

### Simple Domain Redirect

Redirect one domain to another:

```json
[
  {
    "pattern": "example\\.com",
    "replacement": "test.com"
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

## Regex Pattern Tips

- **Escape dots**: Use `\\.` instead of `.` to match literal dots
- **Capture groups**: Use `(pattern)` to capture parts of the URL
- **Character classes**: Use `[^u]` to match any character except 'u'
- **Anchors**: Use `^` for start of string, `$` for end of string
- **Alternatives**: Use `(pattern1|pattern2)` for either/or matching

## Debugging

If rules aren't working as expected:

1. Click "Show Active Rules" in the options page to see what rules are currently active
2. Check the browser console (F12 → Console) for any error messages
3. Test your regex patterns using online regex testers
4. Make sure your JSON is valid (use a JSON validator if needed)

## Technical Details

- **Manifest Version**: 3
- **Permissions**: `declarativeNetRequest`, `storage`, `declarativeNetRequestFeedback`
- **Resource Types**: `main_frame`, `sub_frame`
- **API**: Uses Chrome's `declarativeNetRequest` API for efficient URL redirection

## File Structure

```
urlfix/
├── manifest.json          # Extension manifest
├── background.js          # Service worker with rule management
├── options.html           # Configuration page
├── options.js            # Configuration page logic
├── icon16.png            # 16x16 extension icon
├── icon32.png            # 32x32 extension icon
├── icon48.png            # 48x48 extension icon
├── icon128.png           # 128x128 extension icon
└── README.md             # This file
```

## Contributing

Feel free to submit issues or pull requests to improve this extension!

## License

This project is open source and available under the MIT License.
