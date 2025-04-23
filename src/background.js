// Create context menu items when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Create "Save Form" context menu item
  chrome.contextMenus.create({
    id: "saveForm",
    title: "Save form",
    contexts: ["all"]
  });

  // No longer need the "Fill Form" parent menu
  // We'll add presets directly at the root level
  updateFillFormMenu();
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveForm") {
    chrome.tabs.sendMessage(tab.id, { action: "saveForm" });
  } else if (info.menuItemId.startsWith("preset-")) {
    const presetName = info.menuItemId.replace("preset-", "");
    chrome.tabs.sendMessage(tab.id, {
      action: "fillForm",
      presetName: presetName
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // When a new form preset is saved, update the context menu
  if (message.action === "presetSaved") {
    updateFillFormMenu();
  }
});

// Function to update the context menu with available presets
function updateFillFormMenu() {
  // First remove existing preset items
  chrome.contextMenus.removeAll(() => {
    // Recreate the "Save Form" menu item
    chrome.contextMenus.create({
      id: "saveForm",
      title: "Save form",
      contexts: ["all"]
    });

    // Add a separator after "Save Form"
    chrome.contextMenus.create({
      id: "separator",
      type: "separator",
      contexts: ["all"]
    });

    // Get saved presets and add them to the root menu
    chrome.storage.local.get("formPresets", (result) => {
      const presets = result.formPresets || {};

      if (Object.keys(presets).length === 0) {
        // If no presets, add a disabled item
        chrome.contextMenus.create({
          id: "noPresets",
          title: "No presets available",
          enabled: false,
          contexts: ["all"]
        });
      } else {
        // Add each preset directly to the root menu
        Object.keys(presets).forEach(presetName => {
          chrome.contextMenus.create({
            id: "preset-" + presetName,
            title: "Fill: " + presetName,
            contexts: ["all"]
          });
        });
      }
    });
  });
}