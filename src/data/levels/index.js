import level01 from "./level-01.json";
import level02 from "./level-02-accountability.json";
import level03 from "./level-03-grapes-of-wrath.json";
import level04 from "./level-04-second-lebanon-war.json";
import level05 from "./level-05-cast-lead.json";
import level06 from "./level-06-protective-edge.json";
import level07 from "./level-07-guardian-of-the-walls.json";

const STORAGE_KEY = "israel-td:selected-level-id";

const levelCatalog = [level01, level02, level03, level04, level05, level06, level07];
const byId = new Map(levelCatalog.map((level) => [level.id, level]));

function readStoredLevelId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredLevelId(levelId) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, levelId);
  } catch {
    // Ignore storage failures; selection can still come from the URL.
  }
}

export function getLevelCatalog() {
  return levelCatalog.map(({ id, name, subtitle, historySourceId, historyLibraryId, levelTags }) => ({
    id,
    name,
    subtitle,
    historySourceId,
    historyLibraryId,
    levelTags,
  }));
}

export function resolveInitialLevelConfig() {
  const requestedLevelId =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("level") : null;
  const selectedLevel = byId.get(requestedLevelId) ?? byId.get(readStoredLevelId()) ?? level01;

  writeStoredLevelId(selectedLevel.id);
  return selectedLevel;
}
