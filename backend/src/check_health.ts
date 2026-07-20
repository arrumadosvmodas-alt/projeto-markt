async function checkHealth() {
  try {
    const res = await fetch("https://projeto-markt-production.up.railway.app/health");
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (err) {
    console.error("Health check failed:", err);
  }
}
checkHealth();
