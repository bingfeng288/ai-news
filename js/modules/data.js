// ===== Data Loading =====
import * as state from "./state.js";
import { buildEditionUrl } from "../utils.js";

export async function loadNews() {
  try {
    const response = await fetch("data/news.json");
    const data = await response.json();
    state.setLatestData(data);
    state.setNewsData(data);
    return data;
  } catch (error) {
    console.error("Failed to load news:", error);
    return null;
  }
}

export async function loadEdition(date) {
  try {
    const response = await fetch(buildEditionUrl(date));
    if (!response.ok) throw new Error("Failed to load edition " + date);
    const data = await response.json();
    state.setNewsData(data);
    state.setViewingEdition(date);
    return data;
  } catch (error) {
    console.error("Failed to load edition:", error);
    return null;
  }
}
