chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("rules", (data) => {
    if (!data.rules) {
      chrome.storage.sync.set({ rules: [] });
    } else {
      updateRules(data.rules);
    }
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.rules) {
    updateRules(changes.rules.newValue);
  }
});

// Add debugging function
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getRules") {
    chrome.declarativeNetRequest.getDynamicRules().then(rules => {
      sendResponse({ rules: rules });
    });
    return true;
  }
});


async function updateRules(rules) {
  if (!Array.isArray(rules)) {
    console.error("Rules must be an array");
    return;
  }

  try {
    // First, get existing rules to remove them
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);
    
    // Remove all existing rules
    if (existingRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds
      });
    }

    // If no rules to add, we're done
    if (rules.length === 0) {
      return;
    }

    const formattedRules = rules.map((rule, index) => {
      if (!rule.pattern || !rule.replacement) {
        console.error(`Rule ${index + 1} is missing pattern or replacement`);
        return null;
      }

      // Convert $1, $2, etc. to \1, \2, etc. for Chrome's regexSubstitution
      let replacement = rule.replacement.replace(/\$(\d+)/g, '\\$1');

      return {
        id: index + 1,
        priority: 1,
        action: { 
          type: "redirect", 
          redirect: { 
            regexSubstitution: replacement 
          } 
        },
        condition: { 
          regexFilter: rule.pattern, 
          resourceTypes: ["main_frame", "sub_frame"] 
        }
      };
    }).filter(rule => rule !== null);

    // Add new rules
    if (formattedRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: formattedRules
      });
    }
  } catch (error) {
    console.error("Error updating rules:", error);
  }
}
