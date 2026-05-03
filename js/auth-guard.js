/* js/auth-guard.js */

const SUPABASE_URL = "https://vjopoldebuwcjjezqfum.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqb3BvbGRlYnV3Y2pqZXpxZnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3OTUxNzcsImV4cCI6MjA5MzM3MTE3N30.EPDxfnsj50dryIt-aJsyqZynVTmUdS2n_fNjv1caj24";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "ceetify-logistics-auth",
    storage: window.localStorage
  }
});

window.supabaseClient = supabaseClient;

async function protectPage(allowedRoles = []) {
  document.documentElement.classList.add("auth-loading");

  try {
    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError || !sessionData?.session) {
      showAuthError("Access denied. Please login to continue.");
      redirectToLogin();
      return null;
    }

    const user = sessionData.session.user;

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, full_name, email, phone, role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      showAuthError("Profile error: " + profileError.message);
      return null;
    }

    if (!profile) {
      showAuthError("Profile not found for this account.");
      return null;
    }

    if (profile.status !== "active") {
      await supabaseClient.auth.signOut();
      showAuthError("Your account is not active. Please contact support.");
      redirectToLogin();
      return null;
    }

    if (allowedRoles.length && !allowedRoles.includes(profile.role)) {
      showAuthError("You are not authorized to access this page.");
      setTimeout(() => {
        location.href = "/home.html";
      }, 1200);
      return null;
    }

    window.currentUser = user;
    window.currentProfile = profile;

    document.querySelectorAll("[data-user-name]").forEach(el => {
      el.textContent = profile.full_name || "User";
    });

    document.querySelectorAll("[data-user-email]").forEach(el => {
      el.textContent = profile.email || user.email || "";
    });

    document.documentElement.classList.remove("auth-loading");
    return { user, profile };

  } catch (error) {
    showAuthError("Authentication check failed: " + error.message);
    return null;
  }
}

function redirectToLogin() {
  const currentPage = location.pathname.split("/").pop() || "home.html";
  const next = encodeURIComponent(currentPage);

  setTimeout(() => {
    location.href = `/login.html?next=${next}`;
  }, 1000);
}

function showAuthError(message) {
  document.documentElement.classList.remove("auth-loading");

  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif;background:#f5f8ff;">
      <div style="max-width:420px;width:100%;background:white;border-radius:22px;padding:26px;text-align:center;box-shadow:0 18px 50px rgba(7,31,79,.15);">
        <h2 style="color:#0b347c;margin:0 0 10px;">Ceetify Logistics</h2>
        <p style="color:#dc1f2f;font-weight:bold;margin:0 0 14px;">${message}</p>
        <a href="/login.html" style="display:inline-flex;background:#0b347c;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Go to Login</a>
      </div>
    </div>
  `;
}

async function logoutUser() {
  await supabaseClient.auth.signOut();
  location.href = "/login.html";
}
