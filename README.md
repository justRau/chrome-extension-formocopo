# <img src="public/icons/icon_48.png" width="45" align="left"> Formocopo

# Formocopo Chrome Extension

Formocopo is a Chrome extension that helps you save and reuse form data across website visits.

## Features

- Save form data as presets
- Fill forms with saved presets
- Right-click context menu for easy access
- Works with all form elements: text inputs, checkboxes, radio buttons, selects, textareas
- Popup UI to manage saved presets

## Installation

[**Chrome** extension]() <!-- TODO: Add chrome extension link inside parenthesis -->

### For Development

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The extension should now appear in your Chrome toolbar

### For Auto-Reload During Development

To set up auto-reload during development:

1. Install the "Extensions Reloader" extension from Chrome Web Store
2. After making changes to your extension code, click the Extensions Reloader icon to reload all extensions
3. Alternatively, you can use the following command line tool:

```bash
# Install the Chrome Extensions CLI
npm install -g chrome-extensions-cli

# Watch the directory for changes and auto-reload
chrome-extensions-cli watch
```

## How to Use

1. **Save a Form**:
   - Navigate to a web page with a form
   - Fill in the form fields
   - Right-click on any form element
   - Select "Save form as preset"
   - Enter a name for the preset when prompted

2. **Fill a Form**:
   - Navigate to a web page with a form you want to fill
   - Right-click on any form element
   - Select "Fill form with preset"
   - Choose the preset you want to use from the submenu

3. **Manage Presets**:
   - Click the Formocopo icon in your Chrome toolbar
   - View all saved presets
   - Use the "Fill" button to fill the current form
   - Use the "Delete" button to remove unwanted presets

## Notes

- The extension works best when filling forms on the same URL where they were saved
- When filling forms on different URLs, the extension will try to match fields based on their attributes and position
- Form presets are saved locally in your browser and are not shared with any external services

## TODO
- Show nicer toast about copied/pasted
- Create in-extension page with multiple forms for testing
- Maybe change copy-picker so that when activated any hovered form gets a border (or everything else is faded a bit) and when clicking, it would pick that form
- Allow editing preset name