document.addEventListener("DOMContentLoaded", function() {
  const rulesContainer = document.getElementById("rules-container");
  const addRuleButton = document.getElementById("add-rule");
  const saveButton = document.getElementById("save");
  const debugButton = document.getElementById("debug");
  const toggleJsonButton = document.getElementById("toggle-json");
  const applyJsonButton = document.getElementById("apply-json");
  const statusMessage = document.getElementById("status");
  const debugInfo = document.getElementById("debug-info");
  const activeRules = document.getElementById("active-rules");
  const jsonEditor = document.getElementById("json-editor");
  const rulesJson = document.getElementById("rules-json");

  let rules = [];

  // Default sample rules for new installs
  const sampleRules = [
    {
      "pattern": "google\\.com/search\\?([^#]*&)?q=[^&]*-no-ai",
      "action": "allow",
      "priority": 2
    },
    {
      "pattern": "^(https?://(?:www\\.)?google\\.com/search\\?(?:[^#]*&)?)q=([^&#]*)(.*)$",
      "replacement": "$1q=$2+-no-ai$3",
      "action": "redirect",
      "priority": 1
    }
  ];

  // Load rules from storage
  chrome.storage.sync.get("rules", function(data) {
    if (data.rules && data.rules.length > 0) {
      rules = data.rules;
    } else {
      rules = sampleRules;
      chrome.storage.sync.set({ rules: rules });
    }
    renderRules();
    updateJsonEditor();
  });

  // Render all rules as cards
  function renderRules() {
    rulesContainer.innerHTML = "";

    if (rules.length === 0) {
      rulesContainer.innerHTML = `
        <div class="empty-state">
          <p>No rules configured yet.</p>
          <p>Click "Add Rule" to create your first URL redirect rule.</p>
        </div>
      `;
      return;
    }

    rules.forEach((rule, index) => {
      const card = createRuleCard(rule, index);
      rulesContainer.appendChild(card);
    });
  }

  // Create a single rule card
  function createRuleCard(rule, index) {
    const action = rule.action || "redirect";
    const priority = rule.priority || 1;
    const enabled = rule.enabled !== false;

    const card = document.createElement("div");
    card.className = `rule-card ${action}-rule${enabled ? "" : " disabled"}`;
    card.dataset.index = index;

    card.innerHTML = `
      <div class="rule-header">
        <label class="toggle-switch" title="${enabled ? "Disable" : "Enable"} rule">
          <input type="checkbox" class="enabled-toggle" ${enabled ? "checked" : ""}>
          <span class="toggle-slider"></span>
        </label>
        <span class="rule-number">Rule ${index + 1}</span>
        <select class="field-select action-select">
          <option value="redirect" ${action === "redirect" ? "selected" : ""}>Redirect</option>
          <option value="allow" ${action === "allow" ? "selected" : ""}>Allow</option>
        </select>
        <label class="priority-label">Priority</label>
        <input type="number" class="field-input small priority-input" value="${priority}" min="1">
        <button class="delete-rule" title="Delete rule">&times;</button>
      </div>
      <div class="rule-fields">
        <div class="field-row">
          <label class="field-label">Pattern</label>
          <input type="text" class="field-input pattern-input" value="${escapeHtml(rule.pattern || "")}" placeholder="e.g., example\\.com/old">
        </div>
        <div class="field-row replacement-row ${action === "redirect" ? "visible" : ""}">
          <label class="field-label">Replacement</label>
          <input type="text" class="field-input replacement-input" value="${escapeHtml(rule.replacement || "")}" placeholder="e.g., example.com/new/$1">
        </div>
      </div>
    `;

    // Event listeners for this card
    const enabledToggle = card.querySelector(".enabled-toggle");
    const deleteBtn = card.querySelector(".delete-rule");
    const patternInput = card.querySelector(".pattern-input");
    const replacementInput = card.querySelector(".replacement-input");
    const actionSelect = card.querySelector(".action-select");
    const priorityInput = card.querySelector(".priority-input");
    const replacementRow = card.querySelector(".replacement-row");

    enabledToggle.addEventListener("change", () => {
      const isEnabled = enabledToggle.checked;
      rules[index].enabled = isEnabled;
      if (isEnabled) {
        card.classList.remove("disabled");
      } else {
        card.classList.add("disabled");
      }
      updateJsonEditor();
    });

    deleteBtn.addEventListener("click", () => {
      rules.splice(index, 1);
      renderRules();
      updateJsonEditor();
    });

    patternInput.addEventListener("input", () => {
      rules[index].pattern = patternInput.value;
      updateJsonEditor();
    });

    replacementInput.addEventListener("input", () => {
      rules[index].replacement = replacementInput.value;
      updateJsonEditor();
    });

    actionSelect.addEventListener("change", () => {
      const newAction = actionSelect.value;
      rules[index].action = newAction;

      // Update card styling
      card.className = `rule-card ${newAction}-rule`;
      card.querySelector(".rule-badge").className = `rule-badge ${newAction}`;
      card.querySelector(".rule-badge").textContent = newAction;

      // Show/hide replacement row
      if (newAction === "redirect") {
        replacementRow.classList.add("visible");
      } else {
        replacementRow.classList.remove("visible");
      }

      updateJsonEditor();
    });

    priorityInput.addEventListener("input", () => {
      rules[index].priority = parseInt(priorityInput.value, 10) || 1;
      updateJsonEditor();
    });

    return card;
  }

  // Add new rule
  addRuleButton.addEventListener("click", function() {
    rules.push({
      pattern: "",
      replacement: "",
      action: "redirect",
      priority: 1
    });
    renderRules();
    updateJsonEditor();

    // Scroll to and focus the new rule
    const newCard = rulesContainer.lastElementChild;
    newCard.scrollIntoView({ behavior: "smooth", block: "center" });
    newCard.querySelector(".pattern-input").focus();
  });

  // Save rules
  saveButton.addEventListener("click", function() {
    const validationErrors = validateRules(rules);

    if (validationErrors.length > 0) {
      showStatus("error", "Validation errors:\n" + validationErrors.join("\n"));
      return;
    }

    // Clean up rules before saving (remove empty optional fields)
    const cleanedRules = rules.map(rule => {
      const cleaned = { pattern: rule.pattern };
      if (rule.action === "redirect") {
        cleaned.replacement = rule.replacement;
      }
      if (rule.action && rule.action !== "redirect") {
        cleaned.action = rule.action;
      }
      if (rule.priority && rule.priority !== 1) {
        cleaned.priority = rule.priority;
      }
      if (rule.enabled === false) {
        cleaned.enabled = false;
      }
      return cleaned;
    });

    chrome.storage.sync.set({ rules: cleanedRules }, function() {
      showStatus("success", "Rules saved successfully!");
    });
  });

  // Validate rules
  function validateRules(rulesToValidate) {
    const errors = [];

    rulesToValidate.forEach((rule, index) => {
      const action = rule.action || "redirect";

      if (!rule.pattern || rule.pattern.trim() === "") {
        errors.push(`Rule ${index + 1}: Pattern is required`);
      } else {
        try {
          new RegExp(rule.pattern);
        } catch (e) {
          errors.push(`Rule ${index + 1}: Invalid regex - ${e.message}`);
        }
      }

      if (action === "redirect" && (!rule.replacement || rule.replacement.trim() === "")) {
        errors.push(`Rule ${index + 1}: Replacement is required for redirect rules`);
      }

      if (rule.priority !== undefined && (typeof rule.priority !== "number" || rule.priority < 1)) {
        errors.push(`Rule ${index + 1}: Priority must be a positive number`);
      }
    });

    return errors;
  }

  // Toggle JSON editor
  toggleJsonButton.addEventListener("click", function() {
    jsonEditor.classList.toggle("visible");
    if (jsonEditor.classList.contains("visible")) {
      updateJsonEditor();
    }
  });

  // Update JSON editor with current rules
  function updateJsonEditor() {
    rulesJson.value = JSON.stringify(rules, null, 2);
  }

  // Apply JSON to visual editor
  applyJsonButton.addEventListener("click", function() {
    try {
      const parsed = JSON.parse(rulesJson.value);
      if (!Array.isArray(parsed)) {
        showStatus("error", "JSON must be an array of rules");
        return;
      }
      rules = parsed;
      renderRules();
      showStatus("info", "JSON applied to editor (not saved yet)");
    } catch (e) {
      showStatus("error", "Invalid JSON: " + e.message);
    }
  });

  // Debug button
  debugButton.addEventListener("click", function() {
    chrome.runtime.sendMessage({ action: "getRules" }, function(response) {
      if (response && response.rules) {
        activeRules.textContent = JSON.stringify(response.rules, null, 2);
        debugInfo.style.display = "block";
        showStatus("info", `Found ${response.rules.length} active rules in Chrome`);
      } else {
        showStatus("info", "No active rules found or error occurred");
      }
    });
  });

  // Show status message
  function showStatus(type, message) {
    statusMessage.innerText = message;
    statusMessage.className = type;
    if (type !== "error") {
      setTimeout(() => {
        statusMessage.innerText = "";
        statusMessage.className = "";
      }, 3000);
    }
  }

  // Escape HTML for safe display
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML.replace(/"/g, "&quot;");
  }
});
