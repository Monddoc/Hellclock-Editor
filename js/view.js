export class View {
  constructor() {
    // Initialize the view by caching DOM element references
    this.elements = {
      uploadZone: document.getElementById("upload-zone"),
      fileInput: document.getElementById("file-upload"),
      fileNameDisplay: document.getElementById("filename-display"),
      pathText: document.getElementById("path-text"),
      btnCopy: document.getElementById("btn-copy-path"),
      editorUI: document.getElementById("editor-ui"),
      downloadContainer: document.getElementById("download-container"),

      // Editable Stats
      soulstones: document.getElementById("soulstones"),
      cPoints: document.getElementById("c-points"),
      cPointsInfo: document.getElementById("c-points-info"),

      // Read-Only Info Boxes
      totalDeaths: document.getElementById("total-deaths"),
      totalRuns: document.getElementById("total-runs"),

      // Summary
      summaryPanel: document.getElementById("summary-panel"),
      changeLog: document.getElementById("change-log"),

      campaignDot: document.getElementById("campaign-dot"),
      campaignText: document.getElementById("campaign-text"),
      materialsContainer: document.getElementById("materials-container"),
      shrinesContainer: document.getElementById("shrines-container"),
      btnDownload: document.getElementById("btn-download"),
      btnCompleteAll: document.getElementById("btn-complete-all"),
      modalOverlay: document.getElementById("welcome-modal"),
      btnCloseModal: document.getElementById("btn-close-modal"),
    };
  }

  // Display the editor interface after a file is uploaded
  showEditor(fileName) {
    this.elements.fileNameDisplay.textContent = fileName;
    this.elements.editorUI.style.display = "block";
    this.elements.summaryPanel.style.display = "block";
    this.elements.downloadContainer.classList.add("visible");
  }

  // Render all UI components with data from the model
  render(model) {
    const data = model.getData();
    if (!data) return;

    // Update editable stats
    this.elements.soulstones.value = data.soulStones || 0;

    const rawPoints = data.constellationsData?.constellationPoints || 0;
    this.elements.cPoints.value = rawPoints;
    this.updateConstellationInfo(rawPoints);

    // Update read-only stats
    const stats = model.getCalculatedStats();

    // Format Numbers (e.g., 1,000)
    this.elements.totalDeaths.textContent = stats.deaths.toLocaleString();
    this.elements.totalRuns.textContent = stats.runs.toLocaleString();

    // Update campaign status
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

    // Render dynamic sections
    this.renderMaterials(model);
    this.renderShrines(model);
    this.renderChangeLog(model);
  }

  // Update the constellation points breakdown display
  updateConstellationInfo(rawValue) {
    const points = parseInt(rawValue) || 0;
    const total = points + 10;
    this.elements.cPointsInfo.textContent = "";

    const highlight = document.createElement("span");
    highlight.className = "cp-total-highlight";
    highlight.textContent = `In-Game Total: ${total}`;

    const breakdown = document.createElement("span");
    breakdown.innerText = `\n${points} from Save File\n6 from Unlocking Constellations\n4 from Campaign Completion`;

    this.elements.cPointsInfo.appendChild(highlight);
    this.elements.cPointsInfo.appendChild(breakdown);
  }

  // Render the change log showing modifications made
  renderChangeLog(model) {
    const changes = model.getChanges();
    const container = this.elements.changeLog;
    container.innerHTML = "";

    if (changes.length === 0) {
      const p = document.createElement("p");
      p.style.color = "#666";
      p.style.fontStyle = "italic";
      p.textContent = "No changes made yet.";
      container.appendChild(p);
      return;
    }

    changes.forEach((change) => {
      const row = document.createElement("div");
      row.className = "log-item";

      const label = document.createElement("span");
      label.className = "log-label";
      label.textContent = change.label;

      const diff = document.createElement("span");
      diff.className = "log-diff";

      const oldVal = document.createElement("span");
      oldVal.textContent = change.from;

      const arrow = document.createElement("span");
      arrow.textContent = " ➜ ";

      const newVal = document.createElement("strong");
      newVal.textContent = change.to;

      diff.appendChild(oldVal);
      diff.appendChild(arrow);
      diff.appendChild(newVal);

      row.appendChild(label);
      row.appendChild(diff);
      container.appendChild(row);
    });
  }

  // Render the crafting materials section
  renderMaterials(model) {
    const container = this.elements.materialsContainer;
    container.innerHTML = "";
    const data = model.getData();
    const currencyData = data.currencySaveData?._persistentData || [];

    for (const [id, info] of Object.entries(model.materialMap)) {
      const item = currencyData.find((c) => c._currencyID == id);
      const amount = item ? item._amount : 0;

      const card = document.createElement("div");
      card.className = "mat-item";

      const icon = document.createElement("img");
      icon.className = "mat-icon";
      icon.src = info.icon;
      icon.alt = info.name;
      icon.onerror = () => {
        icon.style.display = "none";
      };

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

      const inputWrapper = document.createElement("div");
      inputWrapper.className = "mat-input-wrapper";
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.value = amount;
      input.dataset.type = "material";
      input.dataset.id = id;

      inputWrapper.appendChild(input);
      card.appendChild(icon);
      card.appendChild(details);
      card.appendChild(inputWrapper);
      container.appendChild(card);
    }
  }

  // Render the cursed shrines section
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
      const missing = spawned
        .filter((x) => !claimedSet.has(x))
        .sort((a, b) => a - b);

      if (spawned.length === 0) return;
      hasContent = true;

      const isComplete = missing.length === 0;
      const name = model.getDungeonName(id);

      const card = document.createElement("div");
      card.className = `shrine-card ${isComplete ? "complete" : "missing"}`;

      const header = document.createElement("div");
      header.className = "dungeon-header";
      const nameSpan = document.createElement("span");
      nameSpan.textContent = name;
      header.appendChild(nameSpan);
      card.appendChild(header);

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
          tag.textContent = `Floor ${index + 1}`;
          tagsDiv.appendChild(tag);
        });
        card.appendChild(tagsDiv);
      }
      container.appendChild(card);
    });

    if (!hasContent) {
      const p = document.createElement("p");
      p.style.color = "#666";
      p.textContent = "No shrine data found.";
      container.appendChild(p);
    }
  }
}
