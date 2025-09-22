document.addEventListener("DOMContentLoaded", function() {
  let rulesTextarea = document.getElementById("rules");
  let saveButton = document.getElementById("save");
  let debugButton = document.getElementById("debug");
  let statusMessage = document.getElementById("status");
  let debugInfo = document.getElementById("debug-info");
  let activeRules = document.getElementById("active-rules");

  if (!rulesTextarea || !saveButton || !statusMessage || !debugButton) {
    console.error("Error: One or more elements not found in DOM.");
    return;
  }

  chrome.storage.sync.get("rules", function(data) {
    if (data.rules && data.rules.length > 0) {
      rulesTextarea.value = JSON.stringify(data.rules, null, 2);
    } else {
      let sampleRules = [
        {
          "pattern": "photos\\.google\\.com/([^u]|$)",
          "replacement": "photos.google.com/u/0/$1"
        },
        {
          "pattern": "example\\.com",
          "replacement": "test.com"
        }
      ];
      rulesTextarea.value = JSON.stringify(sampleRules, null, 2);
      chrome.storage.sync.set({ rules: sampleRules });
    }
    
    // Ensure the textarea displays line breaks properly
    rulesTextarea.style.whiteSpace = 'pre';
  });

  saveButton.addEventListener("click", function() {
    let rules = rulesTextarea.value;
    try {
      let parsedRules = JSON.parse(rules);
      
      // Validate rules
      let validationErrors = [];
      parsedRules.forEach((rule, index) => {
        if (!rule.pattern || !rule.replacement) {
          validationErrors.push(`Rule ${index + 1}: Missing pattern or replacement`);
        } else {
          // Test regex pattern validity
          try {
            new RegExp(rule.pattern);
          } catch (e) {
            validationErrors.push(`Rule ${index + 1}: Invalid regex pattern - ${e.message}`);
          }
        }
      });
      
      if (validationErrors.length > 0) {
        statusMessage.innerText = "❌ Validation errors:\n" + validationErrors.join("\n");
        statusMessage.className = "error";
        return;
      }
      
      chrome.storage.sync.set({ rules: parsedRules }, function() {
        statusMessage.innerText = "✅ Rules saved successfully!";
        statusMessage.className = "success";
        setTimeout(() => {
          statusMessage.innerText = "";
          statusMessage.className = "";
        }, 3000);
        console.log("Rules saved:", parsedRules);
      });
    } catch (e) {
      statusMessage.innerText = "❌ Invalid JSON format: " + e.message;
      statusMessage.className = "error";
      console.error("Error saving rules:", e);
    }
  });

  debugButton.addEventListener("click", function() {
    chrome.runtime.sendMessage({ action: "getRules" }, function(response) {
      if (response && response.rules) {
        activeRules.textContent = JSON.stringify(response.rules, null, 2);
        debugInfo.style.display = "block";
        statusMessage.innerText = `🔍 Found ${response.rules.length} active rules`;
        statusMessage.className = "info";
        setTimeout(() => {
          statusMessage.innerText = "";
          statusMessage.className = "";
        }, 3000);
      } else {
        statusMessage.innerText = "⚠️ No active rules found or error occurred";
        statusMessage.className = "info";
        setTimeout(() => {
          statusMessage.innerText = "";
          statusMessage.className = "";
        }, 3000);
      }
    });
  });
});
