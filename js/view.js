export class View {
  constructor() {
    this.elements = {
      // Upload Section
      uploadZone: document.getElementById("upload-zone"),
      fileInput: document.getElementById("file-upload"),
      fileNameDisplay: document.getElementById("filename-display"),

      // Path Hint Elements
      pathText: document.getElementById("path-text"),
      btnCopy: document.getElementById("btn-copy-path"),

      // Main Editor UI
      editorUI: document.getElementById("editor-ui"),
      downloadContainer: document.getElementById("download-container"),

      // Stats Inputs
      soulstones: document.getElementById("soulstones"),
      cPoints: document.getElementById("c-points"),

      // Campaign Status Indicators
      campaignDot: document.getElementById("campaign-dot"),
      campaignText: document.getElementById("campaign-text"),

      // Containers
      materialsContainer: document.getElementById("materials-container"),
      shrinesContainer: document.getElementById("shrines-container"),

      // Buttons
      btnDownload: document.getElementById("btn-download"),
      btnCompleteAll: document.getElementById("btn-complete-all"),

      // Modal
      modalOverlay: document.getElementById("welcome-modal"),
      btnCloseModal: document.getElementById("btn-close-modal"),
    };
  }

  showEditor(fileName) {
    this.elements.fileNameDisplay.textContent = fileName;
    this.elements.editorUI.style.display = "block";
    this.elements.downloadContainer.classList.add("visible");
  }

  render(model) {
    const data = model.getData();
    if (!data) return;

    // 1. Stats
    this.elements.soulstones.value = data.soulStones || 0;
    this.elements.cPoints.value =
      data.constellationsData?.constellationPoints || 0;

    // 2. Campaign Status
    const flags = data.flags || [];
    const isCampaignDone = flags.includes("SawEndgameWelcome");
    this.elements.campaignDot.className = isCampaignDone
      ? "status-dot active"
      : "status-dot inactive";
    this.elements.campaignText.textContent = isCampaignDone
      ? "Completed"
      : "Incomplete";
    this.elements.campaignText.style.color = isCampaignDone
      ? "var(--success)"
      : "var(--danger)";

    // 3. Render Dynamic Sections
    this.renderMaterials(model);
    this.renderShrines(model);
  }

  renderMaterials(model) {
    const container = this.elements.materialsContainer;
    container.innerHTML = ""; // Clear previous content

    const data = model.getData();
    const currencyData = data.currencySaveData?._persistentData || [];

    for (const [id, info] of Object.entries(model.materialMap)) {
      const item = currencyData.find((c) => c._currencyID == id);
      const amount = item ? item._amount : 0;

      // Create Card
      const card = document.createElement("div");
      card.className = "mat-item";

      // Icon
      const icon = document.createElement("img");
      icon.className = "mat-icon";
      icon.src = info.icon; // Loads path from model
      icon.alt = info.name; // Accessibility

      icon.onerror = () => {
        icon.style.display = "none";
      };

      // Details
      const details = document.createElement("div");
      details.className = "mat-details";

      const name = document.createElement("span");
      name.className = "mat-name";
      name.textContent = info.name;

      const idSpan = document.createElement("span");
      idSpan.className = "mat-id";
      idSpan.textContent = `ID: ${id}`;

      details.appendChild(name);
      details.appendChild(idSpan);

      // Input Wrapper
      const inputWrapper = document.createElement("div");
      inputWrapper.className = "mat-input-wrapper";

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.value = amount;
      // Dataset attributes for Event Delegation
      input.dataset.type = "material";
      input.dataset.id = id;

      inputWrapper.appendChild(input);

      // Assemble
      card.appendChild(icon);
      card.appendChild(details);
      card.appendChild(inputWrapper);

      container.appendChild(card);
    }
  }

  renderShrines(model) {
    const container = this.elements.shrinesContainer;
    container.innerHTML = "";
    const data = model.getData();
    const dungeons = data.dungeonData || [];
    let hasContent = false;

    dungeons.forEach((dungeon) => {
      const id = dungeon.dungeonID;
      const shrineData = dungeon.cursedShrineSpawnData || {};
      const spawned = shrineData.shrineLevelIndexes || [];
      const claimed = shrineData.claimedShrineLevelIndexes || [];
      const claimedSet = new Set(claimed);

      // Calculate missing shrines and sort them
      const missing = spawned
        .filter((x) => !claimedSet.has(x))
        .sort((a, b) => a - b);

      if (spawned.length === 0) return;
      hasContent = true;

      const isComplete = missing.length === 0;
      const name = model.getDungeonName(id);

      const card = document.createElement("div");
      card.className = `shrine-card ${isComplete ? "complete" : "missing"}`;

      // Header
      const header = document.createElement("div");
      header.className = "dungeon-header";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = name;
      header.appendChild(nameSpan);

      card.appendChild(header);

      // Content Body
      if (isComplete) {
        const msg = document.createElement("div");
        msg.className = "complete-msg";
        msg.textContent = "✔ All Collected";
        card.appendChild(msg);
      } else {
        const tagsDiv = document.createElement("div");
        tagsDiv.className = "missing-tags";

        missing.forEach((index) => {
          const tag = document.createElement("span");
          tag.className = "floor-tag";
          // Convert Index to Floor Number
          tag.textContent = `Floor ${index + 1}`;
          tagsDiv.appendChild(tag);
        });

        card.appendChild(tagsDiv);
      }

      container.appendChild(card);
    });

    // Empty State
    if (!hasContent) {
      const p = document.createElement("p");
      p.style.color = "#666";
      p.style.padding = "10px";
      p.textContent = "No shrine data found.";
      container.appendChild(p);
    }
  }
}
