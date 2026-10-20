/* global supabase, updateAuthUI, currentLang */
/* exported initAuth, signUp, signIn, signOut, toggleSubscription, updateEmailLanguage, currentUser, currentProfile */
// Supabase Auth Module
const config = window.__APP_CONFIG__ || {};
const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase config. Copy config.template.js to js/config.js and fill in your values.");
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;

// Keep window.* mirrors in sync with the local state. auth-ui.js (a module)
// reads window.currentUser / window.currentProfile, but primitives/objects are
// assigned by value — so every mutation of the local vars must re-assign window.
function syncAuthState() {
  window.currentUser = currentUser;
  window.currentProfile = currentProfile;
}

async function initAuth() {
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (session) {
      currentUser = session.user;
      await loadProfile();
    }
  } catch (e) {
    console.warn("Supabase auth unavailable:", e.message);
  }
  updateAuthUI();

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      currentUser = session.user;
      await loadProfile();
    } else if (event === "SIGNED_OUT") {
      currentUser = null;
      currentProfile = null;
      syncAuthState();
    }
    updateAuthUI();
  });
}

async function loadProfile() {
  if (!currentUser) return;
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();
  if (!error) currentProfile = data;
  syncAuthState();
}

async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

async function signOut() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = null;
  syncAuthState();
  updateAuthUI();
}

async function toggleSubscription(subscribe) {
  if (!currentUser) return { error: "Not authenticated" };
  const updates = {
    is_subscribed: subscribe,
    subscribed_at: subscribe ? new Date().toISOString() : null,
    language: currentLang || "en",
  };
  const { data, error } = await supabaseClient
    .from("profiles")
    .update(updates)
    .eq("id", currentUser.id)
    .select()
    .single();
  if (!error) currentProfile = data;
  syncAuthState();
  return { data, error };
}

async function updateEmailLanguage(lang) {
  if (!currentUser) return { error: "Not authenticated" };
  const { data, error } = await supabaseClient
    .from("profiles")
    .update({ language: lang })
    .eq("id", currentUser.id)
    .select()
    .single();
  if (!error) currentProfile = data;
  syncAuthState();
  return { data, error };
}

// Expose to window for cross-module access from auth-ui.js
window.initAuth = initAuth;
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.toggleSubscription = toggleSubscription;
window.updateEmailLanguage = updateEmailLanguage;
syncAuthState();
