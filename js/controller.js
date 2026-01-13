import { Model } from "./model.js";
import { View } from "./view.js";

class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.initEventListeners();
  }

  initEventListeners() {
    // --- 0. Modal Logic ---

    // Close on Button Click
    this.view.elements.btnCloseModal.addEventListener("click", () => {
      this.view.elements.modalOverlay.classList.add("hidden");
    });

    // Optional: Close if clicking outside the box
    this.view.elements.modalOverlay.addEventListener("click", (e) => {
      if (e.target === this.view.elements.modalOverlay) {
        this.view.elements.modalOverlay.classList.add("hidden");
      }
    });

    // --- 1. File Upload & Drag/Drop Logic ---

    const zone = this.view.elements.uploadZone;

    // Click to upload
    zone.addEventListener("click", (e) => {
      // Prevent triggering if clicking copy button
      if (e.target.closest("#btn-copy-path") || e.target.closest("#path-text"))
        return;
      this.view.elements.fileInput.click();
    });

    this.view.elements.fileInput.addEventListener("change", (e) => {
      this.handleFileUpload(e.target.files[0]);
    });

    // Drag Enter / Over
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

    // Drag Leave / Drop
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

    // Drop Action
    zone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });

    // --- 2. Copy Path Logic ---
    this.view.elements.btnCopy.addEventListener("click", (e) => {
      e.stopPropagation(); // Stop it from opening file dialog
      const text = this.view.elements.pathText.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = this.view.elements.btnCopy;
        const originalText = btn.innerText;
        btn.innerText = "✔"; // Visual feedback
        setTimeout(() => (btn.innerText = originalText), 1500);
      });
    });

    // --- 3. Input Gatekeeper (No Symbols) ---
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
        ) {
          return;
        }
        if (
          (e.ctrlKey || e.metaKey) &&
          ["a", "c", "v", "x"].includes(e.key.toLowerCase())
        ) {
          return;
        }
        if (!/^[0-9]$/.test(e.key)) {
          e.preventDefault();
        }
      }
    });

    // --- 4. Paste Gatekeeper ---
    this.view.elements.editorUI.addEventListener("paste", (e) => {
      if (e.target.tagName === "INPUT" && e.target.type === "number") {
        const pasteData = (e.clipboardData || window.clipboardData).getData(
          "text"
        );
        if (/\D/.test(pasteData)) {
          e.preventDefault();
        }
      }
    });

    // --- 5. Data Changes ---
    this.view.elements.soulstones.addEventListener("change", (e) => {
      this.model.updateSoulstones(e.target.value);
    });

    this.view.elements.cPoints.addEventListener("change", (e) => {
      this.model.updateConstellationPoints(e.target.value);
    });

    this.view.elements.materialsContainer.addEventListener("change", (e) => {
      if (e.target.dataset.type === "material") {
        const id = e.target.dataset.id;
        const val = e.target.value;
        this.model.updateMaterial(id, val);
      }
    });

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
