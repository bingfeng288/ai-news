// Supabase Auth Module
const SUPABASE_URL = "https://pdocqxcnooowrymhvclb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fkh1cyEJetS36WU1EEIZIA_2rmUBPz6";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;

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
  return { data, error };
}
