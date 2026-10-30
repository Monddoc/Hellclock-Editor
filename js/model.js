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
    // Endless Nightmares dungeons: their shrines only refill missing shrine points
    this.nightmareDungeonIds = new Set([23, 27, 28, 29, 30, 31, 32, 33]);
  }

  isNightmareDungeon(id) {
    return this.nightmareDungeonIds.has(id);
  }

  // Load and parse JSON data from the save file
  loadData(jsonString, fileName) {
    try {
      this.data = JSON.parse(jsonString);
      //Clean up duplicates immediately after parsing
      this._cleanCurrencyData(this.data);
      this.originalData = structuredClone(this.data);
      this.fileName = fileName;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // This merges split stacks (e.g., 999 + 0) into a single entry
  _cleanCurrencyData(dataObj) {
    // Ensure we are only looking at the currency array
    if (
      !dataObj ||
      !dataObj.currencySaveData ||
      !Array.isArray(dataObj.currencySaveData._persistentData)
    ) {
      return;
    }

    const rawList = dataObj.currencySaveData._persistentData;
    const mergedMap = new Map();

    rawList.forEach((item) => {
      // Only process items that actually have a valid ID
      if (item._currencyID === undefined || item._currencyID === null) return;

      const id = item._currencyID;

      if (mergedMap.has(id)) {
        const existing = mergedMap.get(id);
        // Merge the amounts
        existing._amount = (existing._amount || 0) + (item._amount || 0);
        // Merge fragments if the game uses them, just to be clean
        existing._fragmentAmount =
          (existing._fragmentAmount || 0) + (item._fragmentAmount || 0);
      } else {
        // Clone the item to avoid reference issues
        mergedMap.set(id, { ...item });
      }
    });

    // Replace the dirty list with the clean list
    dataObj.currencySaveData._persistentData = Array.from(mergedMap.values());
  }

  // Get the display name for a dungeon based on its ID
  getDungeonName(id) {
    if (this.dungeonNames[id]) return this.dungeonNames[id];
    if (this.isNightmareDungeon(id)) return `Endless Nightmares (${id})`;
    return `Dungeon ${id}`;
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
        parseInt(value) || 0,
      );
    }
  }

  // Update Memory Level
  updateMemoryLevel(value) {
    if (this.data?.greatBellSkillTreeData) {
      this.data.greatBellSkillTreeData._memoryLevel = Math.max(
        0,
        parseInt(value) || 0,
      );
    }
  }

  // Update Hell Level (Ascension)
  updateHellLevel(value) {
    if (this.data?.penancesSkillTreeData) {
      this.data.penancesSkillTreeData._highestHellLevelReached = Math.max(
        0,
        parseInt(value) || 0,
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

  // Mark all unclaimed cursed shrines as completed, Counts added shrines and updates Constellation Points automatically
  completeAllShrines() {
    if (!this.data?.dungeonData) return false;

    let campaignAdded = 0; // New shrines in campaign dungeons
    let nightmareAdded = 0; // New shrines in Endless Nightmares dungeons
    let shrineCap = 0; // Max points shrines can give = total campaign shrines

    this.data.dungeonData.forEach((dungeon) => {
      const data = dungeon.cursedShrineSpawnData;
      if (!data) return;

      const isNightmare = this.isNightmareDungeon(dungeon.dungeonID);
      const spawned = data.shrineLevelIndexes || [];
      if (!isNightmare) shrineCap += spawned.length;
      if (!data.claimedShrineLevelIndexes) data.claimedShrineLevelIndexes = [];

      const claimed = data.claimedShrineLevelIndexes;
      const claimedSet = new Set(claimed);

      spawned.forEach((index) => {
        if (!claimedSet.has(index)) {
          claimed.push(index);
          if (isNightmare) nightmareAdded++;
          else campaignAdded++;
        }
      });
    });

    if (campaignAdded + nightmareAdded === 0) return false;

    // Campaign shrines always add a point; Nightmare shrines only fill up to the cap
    if (this.data.constellationsData) {
      const afterCampaign =
        (this.data.constellationsData.constellationPoints || 0) + campaignAdded;
      const missing = Math.max(0, shrineCap - afterCampaign);
      this.data.constellationsData.constellationPoints =
        afterCampaign + Math.min(nightmareAdded, missing);
    }
    return true;
  }

  // Methods for generating change logs

  // Generate a list of changes made to the data compared to the original
  getChanges() {
    const changes = [];
    if (!this.data || !this.originalData) return changes;

    // Stats
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

    // Memory Level
    const oldMem = this.originalData.greatBellSkillTreeData?._memoryLevel || 0;
    const newMem = this.data.greatBellSkillTreeData?._memoryLevel || 0;
    if (oldMem !== newMem) {
      changes.push({ label: "Memory Level", from: oldMem, to: newMem });
    }

    // Hell Level
    const oldHell =
      this.originalData.penancesSkillTreeData?._highestHellLevelReached || 0;
    const newHell =
      this.data.penancesSkillTreeData?._highestHellLevelReached || 0;
    if (oldHell !== newHell) {
      changes.push({ label: "Hell Level", from: oldHell, to: newHell });
    }

    // Materials
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

    // Cursed Shrines
    this.data.dungeonData.forEach((d, i) => {
      const origD = this.originalData.dungeonData.find(
        (od) => od.dungeonID === d.dungeonID,
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

  // Get Game Mode Flags
  getGameModes() {
    if (!this.data) return {};
    return {
      hardcore: !!this.data.hardcoreModeEnabled,
      relaxed: !!this.data.relaxedModeEnabled,
      vengeance: !!this.data.vengeanceModeEnabled,
      ascension: !!this.data.ascensionMode,
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
