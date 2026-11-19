# FlightRadar360 GeoFS Tampermonkey script

## Set up live sharing

1. Create a dedicated Supabase project for FlightRadar360.
2. In the Supabase SQL Editor, run [`../supabase/flight-radar360-setup.sql`](../supabase/flight-radar360-setup.sql).
3. Enable **Anonymous Sign-Ins** in the project's Authentication settings. The map and userscript use Supabase anonymous accounts; row-level security limits each account to changing only its own aircraft row.
4. Put the project's URL and **publishable/anon key** in [`../flight-radar360-config.js`](../flight-radar360-config.js). This config is public by design and is loaded by both the map and userscript. Never use a service-role key in browser code.
5. Publish the site and install [`flightradar360-geofs.user.js`](https://flightradar360.github.io/tampermonkey/flightradar360-geofs.user.js) in Tampermonkey.

## Use

Open the GeoFS simulator. Minimize and reopen the panel with its button, or press **Alt+Shift+F** to toggle it. The shortcut uses a modifier combination instead of a single GeoFS control key. Departure and arrival are filled from GeoFS flight-plan waypoints marked as departure (`DPT`) and destination (`DST`) when their identifiers are four-character ICAO codes. Callsign is required; squawk is optional and must be a four-digit octal code.

Live sharing is off until the pilot explicitly enables it and confirms the disclosure. While enabled, the script sends the aircraft's current position and the entered flight details to the public Connected Users map every five seconds. The map refreshes connected aircraft while that map mode is open. Turning sharing off removes that pilot's row; if a browser closes before it can remove the row, the map hides the row after 45 seconds without an update.

The Connected Users map displays each shared aircraft with its callsign, route, optional squawk, altitude, and last update time. If the Supabase project has not been configured or anonymous sign-ins are unavailable, the map shows a setup error instead of silently appearing empty.
