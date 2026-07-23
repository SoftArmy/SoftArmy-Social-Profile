const DISCORD_USER_ID = "336286276632313858";
const LANYARD_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

const el = (id) => document.getElementById(id);
el("year").textContent = new Date().getFullYear();

const statusLabels = { online: "Online", idle: "Idle", dnd: "Do Not Disturb", offline: "Offline" };

function formatElapsed(start) {
  if (!start) return "";
  const total = Math.max(0, Date.now() - start);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  return h ? `${h}h ${m}m elapsed` : `${m}m elapsed`;
}

function updatePresence(payload) {
  const data = payload?.data;
  if (!data) throw new Error("Presence data unavailable");

  const status = data.discord_status || "offline";
  el("statusBadge").className = `status-badge ${status}`;
  el("statusText").textContent = statusLabels[status] || status;

  const user = data.discord_user || {};
  el("discordName").textContent = user.global_name || user.display_name || user.username || "SoftArmy";
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    el("discordAvatar").src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
  }

  const activities = Array.isArray(data.activities) ? data.activities : [];
  const custom = activities.find((a) => a.type === 4);
  const primary = activities.find((a) => a.type !== 4 && a.name !== "Spotify");

  if (primary) {
    const label = primary.type === 1 ? `Streaming ${primary.name}` : primary.type === 2 ? `Listening to ${primary.name}` : primary.type === 3 ? `Watching ${primary.name}` : `Playing ${primary.name}`;
    el("activityText").textContent = label;
    const detailParts = [primary.details, primary.state, formatElapsed(primary.timestamps?.start)].filter(Boolean);
    el("activityDetails").textContent = detailParts.join(" • ");
  } else if (custom?.state) {
    el("activityText").textContent = custom.state;
    el("activityDetails").textContent = "Custom status";
  } else {
    el("activityText").textContent = status === "offline" ? "Currently offline" : "Online on Discord";
    el("activityDetails").textContent = "";
  }

  if (data.listening_to_spotify && data.spotify) {
    const s = data.spotify;
    el("spotifyCard").hidden = false;
    el("spotifyArt").src = s.album_art_url || "";
    el("spotifySong").textContent = s.song || "Unknown song";
    el("spotifyArtist").textContent = s.artist || "Unknown artist";
    const start = s.timestamps?.start || Date.now();
    const end = s.timestamps?.end || start + 1;
    const pct = Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
    el("spotifyProgress").style.width = `${pct}%`;
  } else {
    el("spotifyCard").hidden = true;
  }
}

async function fetchPresence() {
  try {
    const response = await fetch(LANYARD_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    updatePresence(await response.json());
  } catch (error) {
    el("statusBadge").className = "status-badge offline";
    el("statusText").textContent = "Unavailable";
    el("activityText").textContent = "Discord presence could not be loaded";
    el("activityDetails").textContent = "Join Lanyard's Discord server and enable presence access.";
    console.warn("Lanyard error:", error);
  }
}
fetchPresence();
setInterval(fetchPresence, 15000);

// Cursor glow
const glow = document.querySelector(".cursor-glow");
window.addEventListener("pointermove", (e) => {
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
  glow.style.opacity = "1";
}, { passive: true });
window.addEventListener("pointerleave", () => glow.style.opacity = "0");

// Lightweight star field
const canvas = el("stars");
const ctx = canvas.getContext("2d");
let stars = [];
function resize() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio;
  canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  stars = Array.from({ length: Math.min(150, Math.floor(innerWidth / 7)) }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    r: Math.random() * 1.25 + .2, a: Math.random() * .55 + .12, v: Math.random() * .08 + .02
  }));
}
function draw() {
  ctx.clearRect(0,0,innerWidth,innerHeight);
  for (const s of stars) {
    s.y -= s.v; if (s.y < -3) { s.y = innerHeight + 3; s.x = Math.random() * innerWidth; }
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle=`rgba(255,255,255,${s.a})`; ctx.fill();
  }
  requestAnimationFrame(draw);
}
addEventListener("resize", resize); resize(); draw();
