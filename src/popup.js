'use strict';

// Load presets when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadPresets();
  setupTabs();
  loadShortcuts();
  setupShortcutListeners();
});

// Setup tabs functionality
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab
      tab.classList.add('active');

      // Show corresponding content
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// Function to load presets
function loadPresets() {
  const presetListElement = document.getElementById('presetList');

  // Clear current list
  presetListElement.innerHTML = '';

  // Get all saved presets
  chrome.storage.local.get("formPresets", (result) => {
    const presets = result.formPresets || {};

    if (Object.keys(presets).length === 0) {
      // No presets found
      presetListElement.innerHTML = `
        <div class="no-presets">
          No form presets saved yet.<br>
          Right-click on a form to save one.
        </div>
      `;
      return;
    }

    // Sort presets by savedAt date (newest first)
    const sortedPresets = Object.entries(presets)
      .sort(([, a], [, b]) => new Date(b.savedAt) - new Date(a.savedAt));

    // Create list items for each preset
    sortedPresets.forEach(([presetName, preset]) => {
      const presetItem = document.createElement('div');
      presetItem.className = 'preset-item';

      // Format date
      const date = new Date(preset.savedAt);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

      // Create HTML for the preset item
      presetItem.innerHTML = `
        <div class="preset-info">
          <div class="preset-name" title="${presetName}">${presetName}</div>
          <div class="preset-date">${formattedDate}</div>
        </div>
        <div class="action-buttons">
          <button class="fill" data-preset="${presetName}">Fill</button>
          <button class="delete" data-preset="${presetName}">Delete</button>
        </div>
      `;

      presetListElement.appendChild(presetItem);
    });

    // Add event listeners for the buttons
    addButtonEventListeners();

    // Also update the preset dropdown for shortcuts
    updateShortcutPresetDropdown();
  });
}

// Add event listeners to fill and delete buttons
function addButtonEventListeners() {
  // Fill button event listeners
  document.querySelectorAll('button.fill').forEach(button => {
    button.addEventListener('click', async () => {
      const presetName = button.getAttribute('data-preset');

      // Get active tab
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (tabs.length > 0) {
        // Send message to content script to fill the form
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "fillForm",
          presetName: presetName
        });

        // Close the popup
        window.close();
      }
    });
  });

  // Delete button event listeners
  document.querySelectorAll('button.delete').forEach(button => {
    button.addEventListener('click', () => {
      const presetName = button.getAttribute('data-preset');

      if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
        // Get all presets, remove the selected one, and save back
        chrome.storage.local.get("formPresets", (result) => {
          const presets = result.formPresets || {};

          if (presets[presetName]) {
            delete presets[presetName];

            // Save back to storage
            chrome.storage.local.set({ formPresets: presets }, () => {
              // Update context menus
              chrome.runtime.sendMessage({ action: "presetSaved" });

              // Reload the list
              loadPresets();

              // Also reload shortcuts in case any shortcuts used this preset
              loadShortcuts();
            });
          }
        });
      }
    });
  });
}

// Function to load shortcuts
function loadShortcuts() {
  const shortcutsListElement = document.getElementById('shortcutsList');

  // Clear current list
  shortcutsListElement.innerHTML = '';

  // Get saved shortcuts
  chrome.storage.local.get("formShortcuts", (result) => {
    const shortcuts = result.formShortcuts || {};

    if (Object.keys(shortcuts).length === 0) {
      shortcutsListElement.innerHTML = `
        <div class="no-presets">
          No shortcuts set yet.<br>
          Add a shortcut below.
        </div>
      `;
      return;
    }

    // Create list items for each shortcut
    Object.entries(shortcuts).forEach(([shortcutKey, presetName]) => {
      const shortcutItem = document.createElement('div');
      shortcutItem.className = 'shortcut-item';

      shortcutItem.innerHTML = `
        <div>
          <span class="shortcut-key">${shortcutKey}</span>
          <span>${presetName}</span>
        </div>
        <button class="delete" data-shortcut="${shortcutKey}">Remove</button>
      `;

      shortcutsListElement.appendChild(shortcutItem);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('#shortcutsList button.delete').forEach(button => {
      button.addEventListener('click', () => {
        const shortcutKey = button.getAttribute('data-shortcut');

        if (confirm(`Are you sure you want to remove the shortcut "${shortcutKey}"?`)) {
          // Get all shortcuts, remove the selected one, and save back
          chrome.storage.local.get("formShortcuts", (result) => {
            const shortcuts = result.formShortcuts || {};

            if (shortcuts[shortcutKey]) {
              delete shortcuts[shortcutKey];

              // Save back to storage
              chrome.storage.local.set({ formShortcuts: shortcuts }, () => {
                // Reload the shortcuts list
                loadShortcuts();
              });
            }
          });
        }
      });
    });
  });
}

// Update the preset dropdown in the shortcuts tab
function updateShortcutPresetDropdown() {
  const presetDropdown = document.getElementById('newShortcutPreset');

  // Clear existing options except the first one
  while (presetDropdown.options.length > 1) {
    presetDropdown.remove(1);
  }

  // Get all presets
  chrome.storage.local.get("formPresets", (result) => {
    const presets = result.formPresets || {};

    // Sort presets by savedAt date (newest first)
    const sortedPresets = Object.entries(presets)
      .sort(([, a], [, b]) => new Date(b.savedAt) - new Date(a.savedAt));

    // Add options for each preset
    sortedPresets.forEach(([presetName, preset]) => {
      const option = document.createElement('option');
      option.value = presetName;
      option.textContent = presetName;
      presetDropdown.appendChild(option);
    });
  });
}

// Setup listeners for shortcut management
function setupShortcutListeners() {
  const addShortcutButton = document.getElementById('addShortcut');
  const shortcutKeyInput = document.getElementById('newShortcutKey');
  const shortcutPresetSelect = document.getElementById('newShortcutPreset');

  // Handle key detection in shortcut input
  shortcutKeyInput.addEventListener('keydown', (event) => {
    // Prevent default to avoid typing in the input
    event.preventDefault();

    // Skip if it's just a modifier key by itself
    if (event.key === 'Control' || event.key === 'Alt' ||
        event.key === 'Shift' || event.key === 'Meta') {
      return;
    }

    // Build the shortcut string
    const shortcutParts = [];
    if (event.ctrlKey) shortcutParts.push('Ctrl');
    if (event.altKey) shortcutParts.push('Alt');
    if (event.shiftKey) shortcutParts.push('Shift');
    if (event.metaKey) shortcutParts.push('Meta');

    // Need at least one modifier
    if (shortcutParts.length === 0) {
      return;
    }

    // Get the key itself
    let key = event.key;

    // Map special keys to their common names
    const keyMap = {
      ' ': 'Space',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Escape': 'Esc',
      'Delete': 'Delete',
      'Backspace': 'Backspace',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PageUp',
      'PageDown': 'PageDown'
    };

    // For F1-F12 keys
    if (key.startsWith('F') && !isNaN(parseInt(key.substring(1)))) {
      // F1-F12 keys are fine as they are
    }
    // For letter keys, use uppercase
    else if (key.length === 1 && /[a-zA-Z]/.test(key)) {
      key = key.toUpperCase();
    }
    // For number keys, just use the number
    else if (key.length === 1 && /[0-9]/.test(key)) {
      key = key;
    }
    // For special keys, use the mapped name
    else if (keyMap[key]) {
      key = keyMap[key];
    }
    // For other keys, use a generic label
    else {
      key = 'Key';
    }

    shortcutParts.push(key);

    // Set the input value
    shortcutKeyInput.value = shortcutParts.join('+');
  });

  // Clear the input on focus
  shortcutKeyInput.addEventListener('focus', () => {
    shortcutKeyInput.value = '';
    shortcutKeyInput.placeholder = 'Press keys...';
  });

  // Restore placeholder on blur
  shortcutKeyInput.addEventListener('blur', () => {
    if (!shortcutKeyInput.value) {
      shortcutKeyInput.placeholder = 'e.g., Alt+F';
    }
  });

  addShortcutButton.addEventListener('click', () => {
    const shortcutKey = shortcutKeyInput.value.trim();
    const presetName = shortcutPresetSelect.value;

    // Validate inputs
    if (!shortcutKey) {
      alert('Please enter a shortcut key combination');
      return;
    }

    if (!presetName) {
      alert('Please select a preset');
      return;
    }

    // No need for manual format validation anymore

    // Get existing shortcuts
    chrome.storage.local.get("formShortcuts", (result) => {
      const shortcuts = result.formShortcuts || {};

      // Check if shortcut already exists
      if (shortcuts[shortcutKey] && !confirm(`Shortcut "${shortcutKey}" is already assigned to "${shortcuts[shortcutKey]}". Do you want to overwrite it?`)) {
        return;
      }

      // Save the new shortcut
      shortcuts[shortcutKey] = presetName;
      chrome.storage.local.set({ formShortcuts: shortcuts }, () => {
        // Clear inputs
        shortcutKeyInput.value = '';
        shortcutKeyInput.placeholder = 'e.g., Alt+F';
        shortcutPresetSelect.selectedIndex = 0;

        // Reload shortcuts list
        loadShortcuts();
      });
    });
  });
}