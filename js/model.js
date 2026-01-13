export class Model {
  constructor() {
    this.data = null;
    this.fileName = "PlayerSave0.json";
    this.materialMap = {
      0: { name: "Tool of Tinkering", icon: "icons/IconTool_Tinkering.png" },
      1: { name: "Tool of Enhancement", icon: "icons/IconTool_Enhancement.png" },
      2: { name: "Greater Tool of Enhancement", icon: "icons/IconTool_GreaterEnhancement.png" },
      3: { name: "Tool of Locksmithing", icon: "icons/IconTool_Locksmithing.png" },
      4: { name: "Imbued Tool of Fury", icon: "icons/IconTool_Fury.png" },
      5: { name: "Imbued Tool of Faith", icon: "icons/IconTool_Faith.png" },
      6: { name: "Imbued Tool of Discipline", icon: "icons/IconTool_Discipline.png" },
      7: { name: "Corrupted Tool", icon: "icons/IconTool_Corrupted.png" },
      8: { name: "Divine Tool", icon: "icons/IconTool_Divine.png" },
    };
    this.dungeonNames = {
      2: "Act 3 (Campaign)",
      10: "Act 1 (Abyss)",
      11: "Act 2 (Abyss)",
      12: "Act 3 (Abyss)",
      14: "Act 1 (Oblivion)",
      15: "Act 2 (Oblivion)",
      16: "Act 3 (Oblivion)",
    };
  }

  loadData(jsonString, fileName) {
    try {
      this.data = JSON.parse(jsonString);
      this.fileName = fileName;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  getDungeonName(id) {
    return this.dungeonNames[id] || `Dungeon ${id}`;
  }

  updateSoulstones(value) {
    if (this.data) {
      // Ensure integer and minimum 0
      const val = parseInt(value) || 0;
      this.data.soulStones = Math.max(0, val);
    }
  }

  updateConstellationPoints(value) {
    if (this.data?.constellationsData) {
      const val = parseInt(value) || 0;
      this.data.constellationsData.constellationPoints = Math.max(0, val);
    }
  }

  updateMaterial(id, value) {
    if (!this.data?.currencySaveData) return;

    const persistentData = this.data.currencySaveData._persistentData;
    let item = persistentData.find((c) => c._currencyID == id);

    // Ensure integer and minimum 0
    const safeValue = Math.max(0, parseInt(value) || 0);

    if (item) {
      item._amount = safeValue;
    } else {
      persistentData.push({
        _currencyID: parseInt(id),
        _amount: safeValue,
        _fragmentAmount: 0,
      });
    }
  }

  completeAllShrines() {
    if (!this.data?.dungeonData) return false;
    let modified = false;

    this.data.dungeonData.forEach((dungeon) => {
      const data = dungeon.cursedShrineSpawnData;
      if (!data) return;

      const spawned = data.shrineLevelIndexes || [];
      if (!data.claimedShrineLevelIndexes) data.claimedShrineLevelIndexes = [];

      const claimed = data.claimedShrineLevelIndexes;
      const claimedSet = new Set(claimed);

      spawned.forEach((index) => {
        if (!claimedSet.has(index)) {
          claimed.push(index);
          modified = true;
        }
      });
    });
    return modified;
  }

  getData() {
    return this.data;
  }

  getDownloadLink() {
    if (!this.data) return null;
    const dataStr = JSON.stringify(this.data, null, 4);
    const blob = new Blob([dataStr], { type: "application/json" });
    return URL.createObjectURL(blob);
  }
}
