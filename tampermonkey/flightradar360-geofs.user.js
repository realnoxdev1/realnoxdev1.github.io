// ==UserScript==
// @name         FlightRadar360 GeoFS Flight Details
// @namespace    https://flightradar360.github.io/
// @version      1.3.1
// @description  Share GeoFS flight details and position with the FlightRadar360 connected-users map.
// @homepageURL  https://flightradar360.github.io/
// @downloadURL  https://flightradar360.github.io/tampermonkey/flightradar360-geofs.user.js
// @updateURL    https://flightradar360.github.io/tampermonkey/flightradar360-geofs.user.js
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://beta.geo-fs.com/geofs.php*
// @run-at       document-idle
// @require      https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.min.js
// @resource     FlightRadar360Config https://flightradar360.github.io/flight-radar360-config.js
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

(() => {
  "use strict";

  const rootId = "flightradar360-flight-details";
  const storageKey = "flightradar360-flight-details-v1";
  if (document.getElementById(rootId)) return;

  const styles = document.createElement("style");
  styles.textContent = `
    #${rootId} {
      all: initial;
      position: fixed;
      z-index: 999999;
      top: 50%;
      right: 16px;
      width: min(320px, calc(100vw - 32px));
      max-height: min(500px, calc(100dvh - 32px));
      color: #eaf3fb;
      font: 14px/1.4 Arial, sans-serif;
      transform: translateY(-50%);
      color-scheme: dark;
    }

    #${rootId} *,
    #${rootId} *::before,
    #${rootId} *::after {
      box-sizing: border-box;
    }

    #${rootId} [hidden] {
      display: none !important;
    }

    #${rootId} .fdr-panel {
      max-height: inherit;
      overflow: auto;
      border: 1px solid rgba(67, 217, 237, .42);
      border-radius: 14px;
      background: rgba(7, 17, 29, .97);
      box-shadow: 0 16px 48px rgba(0, 0, 0, .48), 0 0 24px rgba(35, 205, 230, .11);
      backdrop-filter: blur(12px);
    }

    #${rootId} .fdr-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 16px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, .09);
    }

    #${rootId} .fdr-brand {
      margin: 0 0 4px;
      color: #43d9ed;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
    }

    #${rootId} h2 {
      margin: 0;
      color: #f5f9ff;
      font-size: 18px;
      line-height: 1.2;
    }

    #${rootId} .fdr-close,
    #${rootId} .fdr-launcher {
      display: grid;
      flex: 0 0 auto;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, .16);
      color: #dce8f2;
      background: rgba(255, 255, 255, .06);
      cursor: pointer;
    }

    #${rootId} .fdr-close {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      font: 20px/1 Arial, sans-serif;
    }

    #${rootId} .fdr-intro {
      margin: 0;
      padding: 12px 16px 2px;
      color: #a7b9ca;
      font-size: 12px;
    }

    #${rootId} .fdr-form {
      display: grid;
      gap: 11px;
      padding: 12px 16px 14px;
    }

    #${rootId} .fdr-field {
      display: grid;
      gap: 5px;
      color: #d9e7f2;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .02em;
    }

    #${rootId} .fdr-field input {
      display: block;
      width: 100%;
      height: 36px;
      padding: 0 10px;
      border: 1px solid rgba(157, 181, 202, .28);
      border-radius: 7px;
      outline: none;
      color: #f8fbff;
      background: rgba(255, 255, 255, .055);
      font: 13px Arial, sans-serif;
      letter-spacing: .04em;
    }

    #${rootId} .fdr-field input::placeholder {
      color: #71879b;
      letter-spacing: 0;
    }

    #${rootId} .fdr-field input:focus {
      border-color: #43d9ed;
      box-shadow: 0 0 0 2px rgba(67, 217, 237, .15);
    }

    #${rootId} .fdr-share {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      padding: 10px;
      border: 1px solid rgba(67, 217, 237, .24);
      border-radius: 8px;
      background: rgba(67, 217, 237, .06);
      cursor: pointer;
    }

    #${rootId} .fdr-share input {
      width: 16px;
      height: 16px;
      flex: 0 0 auto;
      margin: 1px 0 0;
      accent-color: #43d9ed;
    }

    #${rootId} .fdr-share-copy {
      display: grid;
      gap: 3px;
    }

    #${rootId} .fdr-share-copy strong {
      color: #eaf3fb;
      font-size: 12px;
    }

    #${rootId} .fdr-share-copy small {
      color: #9db1c3;
      font-size: 10px;
      font-weight: 400;
      line-height: 1.4;
    }

    #${rootId} .fdr-route-status,
    #${rootId} .fdr-save-status,
    #${rootId} .fdr-note {
      margin: 0;
      font-size: 11px;
      line-height: 1.45;
    }

    #${rootId} .fdr-route-status {
      padding: 0 16px;
      color: #73dce9;
    }

    #${rootId} .fdr-save-status {
      min-height: 16px;
      color: #a9bdcc;
    }

    #${rootId} .fdr-save-status[data-state="error"] {
      color: #ff9a9a;
    }

    #${rootId} .fdr-save-status[data-state="success"] {
      color: #86e3b2;
    }

    #${rootId} .fdr-submit {
      min-height: 38px;
      border: 1px solid rgba(67, 217, 237, .56);
      border-radius: 8px;
      color: #e9fcff;
      background: linear-gradient(135deg, #117c91, #12556e);
      font: 700 12px Arial, sans-serif;
      cursor: pointer;
    }

    #${rootId} .fdr-submit:hover,
    #${rootId} .fdr-close:hover,
    #${rootId} .fdr-launcher:hover {
      border-color: #43d9ed;
      filter: brightness(1.12);
    }

    #${rootId} .fdr-footer {
      display: grid;
      gap: 6px;
      padding: 10px 16px 13px;
      border-top: 1px solid rgba(255, 255, 255, .08);
    }

    #${rootId} .fdr-note {
      color: #8398aa;
    }

    #${rootId} .fdr-launcher {
      width: 58px;
      min-height: 42px;
      margin-left: auto;
      border-color: rgba(67, 217, 237, .55);
      border-radius: 10px;
      color: #43d9ed;
      background: rgba(7, 17, 29, .96);
      box-shadow: 0 6px 20px rgba(0, 0, 0, .4);
      font: 800 10px Arial, sans-serif;
      letter-spacing: .08em;
    }

    @media (max-width: 480px) {
      #${rootId} {
        right: 12px;
        width: calc(100vw - 24px);
        max-height: calc(100dvh - 24px);
      }
    }
  `;
  document.head.append(styles);

  const root = document.createElement("div");
  root.id = rootId;
  root.innerHTML = `
    <button class="fdr-launcher" type="button" aria-expanded="false" aria-controls="${rootId}-panel" hidden>
      FDR360
    </button>
    <section class="fdr-panel" id="${rootId}-panel" aria-labelledby="${rootId}-title">
      <header class="fdr-header">
        <div>
          <p class="fdr-brand">GeoFS · FlightRadar360</p>
          <h2 id="${rootId}-title">Flight details</h2>
        </div>
        <button class="fdr-close" type="button" aria-label="Minimize flight details">−</button>
      </header>
      <p class="fdr-intro">Enter your flight info. Departure and arrival can sync from your GeoFS flight plan.</p>
      <p class="fdr-route-status" role="status" aria-live="polite">Checking the GeoFS flight plan…</p>
      <form class="fdr-form">
        <label class="fdr-field" for="${rootId}-departure">
          Departure ICAO
          <input id="${rootId}-departure" name="departure" type="text" maxlength="4" pattern="[A-Za-z0-9]{4}" autocomplete="off" autocapitalize="characters" placeholder="e.g. KJFK" required>
        </label>
        <label class="fdr-field" for="${rootId}-arrival">
          Arrival ICAO
          <input id="${rootId}-arrival" name="arrival" type="text" maxlength="4" pattern="[A-Za-z0-9]{4}" autocomplete="off" autocapitalize="characters" placeholder="e.g. EGLL" required>
        </label>
        <label class="fdr-field" for="${rootId}-callsign">
          Callsign
          <input id="${rootId}-callsign" name="callsign" type="text" maxlength="24" autocomplete="off" placeholder="Your GeoFS callsign" required>
        </label>
        <label class="fdr-field" for="${rootId}-squawk">
          Squawk code <span>(optional)</span>
          <input id="${rootId}-squawk" name="squawk" type="text" inputmode="numeric" maxlength="4" pattern="[0-7]{4}" autocomplete="off" placeholder="0000–7777">
        </label>
        <label class="fdr-share">
          <input name="shareLive" type="checkbox">
          <span class="fdr-share-copy">
            <strong>Share live aircraft</strong>
            <small>When on, your position, callsign, route, and squawk are visible to other Connected Users map visitors.</small>
          </span>
        </label>
        <button class="fdr-submit" type="submit">Save flight details</button>
      </form>
      <footer class="fdr-footer">
        <p class="fdr-save-status" role="status" aria-live="polite">Details are saved only in this browser.</p>
        <p class="fdr-note">Live sharing is off until you enable it. Disable it at any time to remove your map marker.</p>
      </footer>
    </section>
  `;
  document.body.append(root);

  const panel = root.querySelector(".fdr-panel");
  const launcher = root.querySelector(".fdr-launcher");
  const closeButton = root.querySelector(".fdr-close");
  const form = root.querySelector(".fdr-form");
  const departureInput = root.querySelector('[name="departure"]');
  const arrivalInput = root.querySelector('[name="arrival"]');
  const callsignInput = root.querySelector('[name="callsign"]');
  const squawkInput = root.querySelector('[name="squawk"]');
  const shareLiveInput = root.querySelector('[name="shareLive"]');
  const routeStatus = root.querySelector(".fdr-route-status");
  const saveStatus = root.querySelector(".fdr-save-status");
  let sharingClient = null;
  let sharingUserId = null;
  let sharingEnabled = false;
  let sharingAttemptId = 0;
  let sharingInterval = null;
  let sharingRequestInFlight = false;
  let pendingShareRemoval = false;

  function setSaveStatus(message, state = "info") {
    saveStatus.textContent = message;
    saveStatus.dataset.state = state;
  }

  function normalizeIcao(value) {
    const airport = String(value ?? "").trim().toUpperCase();
    return /^[A-Z0-9]{4}$/.test(airport) ? airport : "";
  }

  function readFormData() {
    return {
      departure: departureInput.value.trim().toUpperCase(),
      arrival: arrivalInput.value.trim().toUpperCase(),
      callsign: callsignInput.value.trim(),
      squawk: squawkInput.value.trim()
    };
  }

  function storeFormData() {
    try {
      GM_setValue(storageKey, readFormData());
      setSaveStatus(
        sharingEnabled ? "Saved locally. Updating the Connected Users map…" : "Saved only in this browser.",
        sharingEnabled ? "info" : "success"
      );
      if (sharingEnabled) void publishFlightData();
    } catch (error) {
      console.error("FlightRadar360 could not save flight details in Tampermonkey storage.", error);
      setSaveStatus("Could not save details. Check Tampermonkey storage permissions.", "error");
    }
  }

  function restoreFormData() {
    try {
      const saved = GM_getValue(storageKey, {});
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return;
      departureInput.value = normalizeIcao(saved.departure);
      arrivalInput.value = normalizeIcao(saved.arrival);
      callsignInput.value = typeof saved.callsign === "string" ? saved.callsign.slice(0, 24) : "";
      squawkInput.value = typeof saved.squawk === "string" && /^[0-7]{4}$/.test(saved.squawk)
        ? saved.squawk
        : "";
    } catch (error) {
      console.error("FlightRadar360 could not read saved flight details from Tampermonkey storage.", error);
      setSaveStatus("Could not load saved details from Tampermonkey.", "error");
    }
  }

  async function getSharingSession() {
    const configSource = GM_getResourceText("FlightRadar360Config");
    if (typeof configSource !== "string" || !configSource) {
      throw new Error("Tampermonkey did not load the FlightRadar360 config resource. Re-save the script and try again.");
    }
    const readConfigValue = name =>
      configSource.match(new RegExp(`\\b${name}\\s*:\\s*["']([^"']*)["']`))?.[1] ?? "";
    const config = {
      supabaseUrl: readConfigValue("supabaseUrl"),
      supabaseAnonKey: readConfigValue("supabaseAnonKey")
    };
    if (
      typeof config.supabaseUrl !== "string" ||
      !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl) ||
      config.supabaseUrl.includes("YOUR_PROJECT_ID") ||
      typeof config.supabaseAnonKey !== "string" ||
      config.supabaseAnonKey.length < 20 ||
      config.supabaseAnonKey.includes("YOUR_SUPABASE")
    ) {
      throw new Error("FlightRadar360 Supabase settings are not configured.");
    }

    const requiredSupabase = typeof supabase === "undefined" ? null : supabase;
    const supabaseApi = [
      globalThis.supabase,
      requiredSupabase,
      unsafeWindow.supabase
    ].find(api => typeof api?.createClient === "function");
    if (!supabaseApi || typeof supabaseApi.createClient !== "function") {
      throw new Error("The Supabase client could not be loaded. Check that Tampermonkey loaded the @require script.");
    }
    if (!sharingClient) {
      sharingClient = supabaseApi.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
    }

    const currentSession = await sharingClient.auth.getSession();
    if (currentSession.error) throw currentSession.error;
    let session = currentSession.data.session;
    if (!session) {
      const anonymousSignIn = await sharingClient.auth.signInAnonymously();
      if (anonymousSignIn.error) throw anonymousSignIn.error;
      session = anonymousSignIn.data.session;
    }
    if (!session?.user?.id) throw new Error("Supabase did not return an anonymous user session.");
    sharingUserId = session.user.id;
    return session;
  }

  async function removeSharedAircraft() {
    if (!sharingClient || !sharingUserId) return;
    const result = await sharingClient
      .from("connected_aircraft")
      .delete()
      .eq("user_id", sharingUserId);
    if (result.error) throw result.error;
  }

  async function publishFlightData() {
    if (!sharingEnabled || sharingRequestInFlight) return;
    sharingRequestInFlight = true;
    try {
      const data = readFormData();
      const coordinates = unsafeWindow.geofs?.aircraft?.instance?.llaLocation;
      if (
        !/^[A-Z0-9]{4}$/.test(data.departure) ||
        !/^[A-Z0-9]{4}$/.test(data.arrival) ||
        !data.callsign ||
        (data.squawk && !/^[0-7]{4}$/.test(data.squawk))
      ) {
        setSaveStatus("Complete the required flight fields before sharing.", "error");
        return;
      }
      if (!coordinates || coordinates.length < 2) {
        setSaveStatus("Waiting for the GeoFS aircraft position…", "info");
        return;
      }

      const latitude = Number(coordinates[0]);
      const longitude = Number(coordinates[1]);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        setSaveStatus("Waiting for a valid GeoFS aircraft position…", "info");
        return;
      }

      const session = await getSharingSession();
      if (!sharingEnabled) return;
      const altitude = Number(coordinates[2]);
      const result = await sharingClient.from("connected_aircraft").upsert({
        user_id: session.user.id,
        callsign: data.callsign,
        departure_icao: data.departure,
        arrival_icao: data.arrival,
        squawk: data.squawk || null,
        latitude,
        longitude,
        altitude_m: Number.isFinite(altitude) ? altitude : null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      if (result.error) throw result.error;
      setSaveStatus("Sharing live position and flight details.", "success");
    } catch (error) {
      console.error("FlightRadar360 could not share this GeoFS flight.", error);
      setSaveStatus(`Live sharing failed: ${error.message || "check the connection and Supabase setup."}`, "error");
    } finally {
      sharingRequestInFlight = false;
      if (pendingShareRemoval) {
        pendingShareRemoval = false;
        try {
          await removeSharedAircraft();
          setSaveStatus("Sharing stopped and your map marker was removed.", "success");
        } catch (error) {
          console.error("FlightRadar360 could not remove the shared aircraft row.", error);
          setSaveStatus("Sharing stopped; your marker will expire if it cannot be removed.", "error");
        }
      }
    }
  }

  async function stopSharing() {
    sharingAttemptId++;
    sharingEnabled = false;
    if (sharingInterval !== null) {
      window.clearInterval(sharingInterval);
      sharingInterval = null;
    }
    if (sharingRequestInFlight) {
      pendingShareRemoval = true;
      return;
    }
    try {
      await removeSharedAircraft();
      setSaveStatus("Sharing stopped and your map marker was removed.", "success");
    } catch (error) {
      console.error("FlightRadar360 could not remove the shared aircraft row.", error);
      setSaveStatus("Sharing stopped; your marker will expire if it cannot be removed.", "error");
    }
  }

  async function startSharing() {
    if (!form.reportValidity()) {
      shareLiveInput.checked = false;
      return;
    }
    if (!window.confirm(
      "Share your live GeoFS position, callsign, route, and optional squawk with everyone viewing the FlightRadar360 Connected Users map?"
    )) {
      shareLiveInput.checked = false;
      return;
    }
    const attemptId = ++sharingAttemptId;
    try {
      await getSharingSession();
      if (!shareLiveInput.checked || attemptId !== sharingAttemptId) return;
      sharingEnabled = true;
      await publishFlightData();
      if (sharingEnabled && sharingInterval === null) {
        sharingInterval = window.setInterval(publishFlightData, 5000);
      }
    } catch (error) {
      console.error("FlightRadar360 could not start live sharing.", error);
      if (attemptId !== sharingAttemptId) return;
      shareLiveInput.checked = false;
      setSaveStatus(`Live sharing is unavailable: ${error.message || "check the Supabase setup."}`, "error");
    }
  }

  let lastRouteSignature = null;
  const lastAutoFilled = { departure: "", arrival: "" };

  function getWaypointIcao(waypoint) {
    if (!waypoint || typeof waypoint !== "object") return "";
    for (const candidate of [
      waypoint.ident,
      waypoint.icao,
      waypoint.navaid?.icao,
      waypoint.navaid?.ident
    ]) {
      const airport = normalizeIcao(candidate);
      if (airport) return airport;
    }
    return "";
  }

  function readFlightPlanAirports() {
    const flightPlan = unsafeWindow.geofs?.flightPlan;
    if (!Array.isArray(flightPlan?.waypointArray)) return null;

    const waypoints = flightPlan.waypointArray;
    const departure = waypoints.find(waypoint => waypoint?.type?.toUpperCase() === "DPT");
    const arrival = [...waypoints].reverse().find(waypoint => waypoint?.type?.toUpperCase() === "DST");
    return {
      departure: getWaypointIcao(departure),
      arrival: getWaypointIcao(arrival)
    };
  }

  function syncAirportsFromFlightPlan() {
    let airports;
    try {
      airports = readFlightPlanAirports();
    } catch (error) {
      console.error("FlightRadar360 could not read the GeoFS flight plan.", error);
      routeStatus.textContent = "Could not read the GeoFS flight plan. You can enter airports manually.";
      return;
    }

    if (!airports) {
      routeStatus.textContent = "Waiting for the GeoFS flight plan…";
      return;
    }

    const signature = JSON.stringify(airports);
    if (signature === lastRouteSignature) return;
    lastRouteSignature = signature;

    const updatedFields = [];
    let fieldsCleared = false;
    for (const [field, input] of [
      ["departure", departureInput],
      ["arrival", arrivalInput]
    ]) {
      const airport = airports[field];
      if (airport) {
        input.value = airport;
        lastAutoFilled[field] = airport;
        updatedFields.push(field);
      } else if (lastAutoFilled[field] && input.value === lastAutoFilled[field]) {
        input.value = "";
        lastAutoFilled[field] = "";
        fieldsCleared = true;
      }
    }

    if (updatedFields.length) {
      storeFormData();
      routeStatus.textContent = `Auto-filled ${updatedFields.join(" and ")} from the GeoFS flight plan.`;
    } else if (fieldsCleared) {
      storeFormData();
      routeStatus.textContent = "Removed airports that are no longer in the GeoFS flight plan.";
    } else {
      routeStatus.textContent = "No departure or arrival airports found in the GeoFS flight plan.";
    }
  }

  for (const input of [departureInput, arrivalInput]) {
    input.addEventListener("input", () => {
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    });
  }
  squawkInput.addEventListener("input", () => {
    squawkInput.value = squawkInput.value.replace(/[^0-7]/g, "").slice(0, 4);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    departureInput.value = departureInput.value.trim().toUpperCase();
    arrivalInput.value = arrivalInput.value.trim().toUpperCase();
    callsignInput.value = callsignInput.value.trim();
    squawkInput.value = squawkInput.value.trim();
    if (!form.reportValidity()) return;
    storeFormData();
  });

  shareLiveInput.addEventListener("change", () => {
    if (shareLiveInput.checked) void startSharing();
    else void stopSharing();
  });

  closeButton.addEventListener("click", () => {
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  });
  launcher.addEventListener("click", () => {
    panel.hidden = false;
    launcher.hidden = true;
    launcher.setAttribute("aria-expanded", "true");
    departureInput.focus();
  });
  document.addEventListener("keydown", event => {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing ||
      !event.altKey ||
      !event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.key.toLowerCase() !== "f"
    ) return;

    event.preventDefault();
    event.stopPropagation();
    const open = panel.hidden;
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) departureInput.focus();
    else if (root.contains(document.activeElement)) launcher.focus();
  }, true);

  restoreFormData();
  syncAirportsFromFlightPlan();
  const flightPlanPoll = window.setInterval(syncAirportsFromFlightPlan, 1000);
  window.addEventListener("pagehide", () => window.clearInterval(flightPlanPoll), { once: true });
})();
