export class Model {
  constructor() {
    // Initialize the model with default data structures and mappings
    this.data = null;
    this.originalData = null; // To track diffs
    this.fileName = "PlayerSave0.json";

    // Mapping of material IDs to their names and icons for display
    this.materialMap = {
      0: { name: "Tool of Tinkering", icon: "icons/IconTool_Tinkering.png" },
      1: {
        name: "Tool of Enhancement",
        icon: "icons/IconTool_Enhancement.png",
      },
      2: {
        name: "Greater Tool of Enhancement",
        icon: "icons/IconTool_GreaterEnhancement.png",
      },
      3: {
        name: "Tool of Locksmithing",
        icon: "icons/IconTool_Locksmithing.png",
      },
      4: { name: "Imbued Tool of Fury", icon: "icons/IconTool_Fury.png" },
      5: { name: "Imbued Tool of Faith", icon: "icons/IconTool_Faith.png" },
      6: {
        name: "Imbued Tool of Discipline",
        icon: "icons/IconTool_Discipline.png",
      },
      7: { name: "Corrupted Tool", icon: "icons/IconTool_Corrupted.png" },
      8: { name: "Divine Tool", icon: "icons/IconTool_Divine.png" },
    };
    // Mapping of dungeon IDs to their display names
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

  // Load and parse JSON data from the save file
  loadData(jsonString, fileName) {
    try {
      this.data = JSON.parse(jsonString);
      this.originalData = structuredClone(this.data);
      this.fileName = fileName;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // Get the display name for a dungeon based on its ID
  getDungeonName(id) {
    return this.dungeonNames[id] || `Dungeon ${id}`;
  }

  // Methods for updating game data

  // Update the player's soulstones value
  updateSoulstones(value) {
    if (this.data) this.data.soulStones = Math.max(0, parseInt(value) || 0);
  }

  // Update the player's constellation points value
  updateConstellationPoints(value) {
    if (this.data?.constellationsData) {
      this.data.constellationsData.constellationPoints = Math.max(
        0,
        parseInt(value) || 0
      );
    }
  }

  // Update the amount of a specific crafting material
  updateMaterial(id, value) {
    if (!this.data?.currencySaveData) return;

    const persistentData = this.data.currencySaveData._persistentData;
    let item = persistentData.find((c) => c._currencyID == id);

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

  // Mark all unclaimed cursed shrines as completed
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

  // Methods for generating change logs

  // Generate a list of changes made to the data compared to the original
  getChanges() {
    const changes = [];
    if (!this.data || !this.originalData) return changes;

    if (this.data.soulStones !== this.originalData.soulStones) {
      changes.push({
        label: "Soulstones",
        from: this.originalData.soulStones,
        to: this.data.soulStones,
      });
    }
    if (
      this.data.constellationsData?.constellationPoints !==
      this.originalData.constellationsData?.constellationPoints
    ) {
      changes.push({
        label: "Constellation Pts",
        from: this.originalData.constellationsData.constellationPoints,
        to: this.data.constellationsData.constellationPoints,
      });
    }

    const origMats = this.originalData.currencySaveData._persistentData;
    const newMats = this.data.currencySaveData._persistentData;

    newMats.forEach((m) => {
      const orig = origMats.find((o) => o._currencyID === m._currencyID);
      const origAmt = orig ? orig._amount : 0;
      if (m._amount !== origAmt) {
        const name =
          this.materialMap[m._currencyID]?.name || `Mat ID ${m._currencyID}`;
        changes.push({ label: name, from: origAmt, to: m._amount });
      }
    });

    this.data.dungeonData.forEach((d, i) => {
      const origD = this.originalData.dungeonData.find(
        (od) => od.dungeonID === d.dungeonID
      );
      if (!origD) return;

      const newClaimed =
        d.cursedShrineSpawnData?.claimedShrineLevelIndexes?.length || 0;
      const oldClaimed =
        origD.cursedShrineSpawnData?.claimedShrineLevelIndexes?.length || 0;

      if (newClaimed > oldClaimed) {
        const name = this.getDungeonName(d.dungeonID);
        changes.push({
          label: `Shrines (${name})`,
          from: `${oldClaimed} collected`,
          to: `${newClaimed} collected`,
        });
      }
    });

    return changes;
  }

  // Calculate and return simplified stats like total deaths and runs
  getCalculatedStats() {
    if (!this.data) return { deaths: 0, runs: 0 };

    const findVal = (...keys) => {
      for (const key of keys) {
        if (this.data[key] !== undefined && this.data[key] !== null) {
          return this.data[key];
        }
      }
      return 0;
    };

    return {
      deaths: findVal("cumulativeTotalDeaths", "totalDeaths"),
      runs: findVal("totalRuns", "cumulativeTotalRuns", "_totalRuns"),
    };
  }

  // Get the current data object
  getData() {
    return this.data;
  }

  // Generate a download link for the modified save file
  getDownloadLink() {
    if (!this.data) return null;
    const dataStr = JSON.stringify(this.data, null, 4);
    const blob = new Blob([dataStr], { type: "application/json" });
    return URL.createObjectURL(blob);
  }
}
