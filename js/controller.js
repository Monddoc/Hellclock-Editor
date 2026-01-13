import { Model } from "./model.js";
import { View } from "./view.js";

class Controller {
  constructor(model, view) {
    // Initialize the controller with model and view instances
    this.model = model;
    this.view = view;
    this.initEventListeners();
  }

  // Set up all event listeners for user interactions
  initEventListeners() {
    // Modal Logic: Handle closing the welcome modal
    if (this.view.elements.btnCloseModal) {
      this.view.elements.btnCloseModal.addEventListener("click", () => {
        this.view.elements.modalOverlay.classList.add("hidden");
      });
    }

    if (this.view.elements.modalOverlay) {
      this.view.elements.modalOverlay.addEventListener("click", (e) => {
        if (e.target === this.view.elements.modalOverlay) {
          this.view.elements.modalOverlay.classList.add("hidden");
        }
      });
    }

    // File Upload: Handle clicking on the upload zone and drag-and-drop
    const zone = this.view.elements.uploadZone;
    zone.addEventListener("click", (e) => {
      if (e.target.closest("#btn-copy-path") || e.target.closest("#path-text"))
        return;
      this.view.elements.fileInput.click();
    });

    this.view.elements.fileInput.addEventListener("change", (e) => {
      this.handleFileUpload(e.target.files[0]);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      zone.addEventListener(
        eventName,
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          zone.classList.add("drag-active");
        },
        false
      );
    });

    ["dragleave", "drop"].forEach((eventName) => {
      zone.addEventListener(
        eventName,
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          zone.classList.remove("drag-active");
        },
        false
      );
    });

    zone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) this.handleFileUpload(files[0]);
    });

    // Copy Path: Handle copying the save file path to clipboard
    this.view.elements.btnCopy.addEventListener("click", (e) => {
      e.stopPropagation();
      const text = this.view.elements.pathText.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = this.view.elements.btnCopy;
        const originalText = btn.innerText;
        btn.innerText = "✔";
        setTimeout(() => (btn.innerText = originalText), 1500);
      });
    });

    // Input Validation: Restrict input to numbers only for number fields
    this.view.elements.editorUI.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" && e.target.type === "number") {
        if (
          [
            "Backspace",
            "Delete",
            "Tab",
            "Escape",
            "Enter",
            "Home",
            "End",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
          ].includes(e.key)
        )
          return;
        if (
          (e.ctrlKey || e.metaKey) &&
          ["a", "c", "v", "x"].includes(e.key.toLowerCase())
        )
          return;
        if (!/^[0-9]$/.test(e.key)) e.preventDefault();
      }
    });

    this.view.elements.editorUI.addEventListener("paste", (e) => {
      if (e.target.tagName === "INPUT" && e.target.type === "number") {
        const pasteData = (e.clipboardData || window.clipboardData).getData(
          "text"
        );
        if (/\D/.test(pasteData)) e.preventDefault();
      }
    });

    // Data Changes: Handle updates to game data and re-render UI
    const updateAndRender = (updateFn, val) => {
      updateFn.call(this.model, val);
      this.view.renderChangeLog(this.model);
    };

    // Soulstones input
    this.view.elements.soulstones.addEventListener("input", (e) => {
      updateAndRender(this.model.updateSoulstones, e.target.value);
    });

    // Constellation Points input
    this.view.elements.cPoints.addEventListener("input", (e) => {
      const val = e.target.value;
      this.model.updateConstellationPoints(val);
      this.view.updateConstellationInfo(val);
      this.view.renderChangeLog(this.model);
    });

    // Materials input
    this.view.elements.materialsContainer.addEventListener("input", (e) => {
      if (e.target.dataset.type === "material") {
        this.model.updateMaterial(e.target.dataset.id, e.target.value);
        this.view.renderChangeLog(this.model);
      }
    });

    // Buttons: Handle complete all shrines and download actions
    this.view.elements.btnCompleteAll.addEventListener("click", () => {
      const modified = this.model.completeAllShrines();
      if (modified) {
        this.view.render(this.model);
      } else {
        alert("All shrines are already collected!");
      }
    });

    this.view.elements.btnDownload.addEventListener("click", () => {
      this.handleDownload();
    });
  }

  // Handle the file upload process, parse JSON, and update the view
  handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const success = this.model.loadData(e.target.result, file.name);
      if (success) {
        this.view.showEditor(file.name);
        this.view.render(this.model);
      } else {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
  }

  // Handle downloading the modified save file
  handleDownload() {
    const url = this.model.getDownloadLink();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = this.model.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

const app = new Controller(new Model(), new View());
