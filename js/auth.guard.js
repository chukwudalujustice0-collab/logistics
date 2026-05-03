/* js/auth-guard.js */

const SUPABASE_URL = "https://vjopoldebuwcjjezqfum.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function protectPage(allowedRoles = []) {
  try {
    document.documentElement.classList.add("auth-loading");

    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError || !sessionData.session) {
      showAuthError("Access denied. Please login to continue.");
      redirectToLogin();
      return null;
    }

    const user = sessionData.session.user;

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      showAuthError("Profile not found. Please login again.");
      await supabaseClient.auth.signOut();
      redirectToLogin();
      return null;
    }

    if (profile.status !== "active") {
      showAuthError("Your account is not active. Please contact support.");
      await supabaseClient.auth.signOut();
      redirectToLogin();
      return null;
    }

    if (allowedRoles.length && !allowedRoles.includes(profile.role)) {
      showAuthError("You are not authorized to access this page.");
      setTimeout(() => {
        location.href = "home.html";
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
    console.error(error);
    showAuthError("Authentication check failed. Please login again.");
    redirectToLogin();
    return null;
  }
}

function redirectToLogin() {
  const next = encodeURIComponent(location.pathname.split("/").pop() || "home.html");

  setTimeout(() => {
    location.href = `login.html?next=${next}`;
  }, 1200);
}

function showAuthError(message) {
  document.body.innerHTML = `
    <div style="
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:24px;
      font-family:Arial,sans-serif;
      background:#f5f8ff;
    ">
      <div style="
        max-width:420px;
        width:100%;
        background:white;
        border-radius:22px;
        padding:26px;
        text-align:center;
        box-shadow:0 18px 50px rgba(7,31,79,.15);
      ">
        <h2 style="color:#0b347c;margin:0 0 10px;">Ceetify Logistics</h2>
        <p style="color:#dc1f2f;font-weight:bold;margin:0 0 14px;">${message}</p>
        <p style="color:#667085;margin:0;">Redirecting...</p>
      </div>
    </div>
  `;
}

async function logoutUser() {
  await supabaseClient.auth.signOut();
  location.href = "login.html";
}
