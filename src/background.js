// Create context menu items when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Create "Save Form" context menu item
  chrome.contextMenus.create({
    id: "saveForm",
    title: "Save form as preset",
    contexts: ["all"]
  });

  // Create "Fill Form" parent menu
  chrome.contextMenus.create({
    id: "fillForm",
    title: "Fill form with preset",
    contexts: ["all"]
  });
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

// Function to update the "Fill Form" context menu with available presets
function updateFillFormMenu() {
  // First remove existing preset items
  chrome.contextMenus.removeAll(() => {
    // Recreate the parent menu items
    chrome.contextMenus.create({
      id: "saveForm",
      title: "Save form as preset",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "fillForm",
      title: "Fill form with preset",
      contexts: ["all"]
    });

    // Get saved presets and add them to the menu
    chrome.storage.local.get("formPresets", (result) => {
      const presets = result.formPresets || {};

      if (Object.keys(presets).length === 0) {
        // If no presets, add a disabled item
        chrome.contextMenus.create({
          id: "noPresets",
          title: "No presets saved",
          parentId: "fillForm",
          enabled: false,
          contexts: ["all"]
        });
      } else {
        // Add each preset as a submenu item
        Object.keys(presets).forEach(presetName => {
          chrome.contextMenus.create({
            id: "preset-" + presetName,
            title: presetName,
            parentId: "fillForm",
            contexts: ["all"]
          });
        });
      }
    });
  });
}