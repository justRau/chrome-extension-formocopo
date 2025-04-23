'use strict';

// Load presets when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadPresets();
});

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
            });
          }
        });
      }
    });
  });
}