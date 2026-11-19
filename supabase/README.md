# FlightRadar360 account setup

## Enable Discord sign-in

1. In the Discord Developer Portal, open the FlightRadar360 application and add this OAuth2 redirect URI:
   `https://knqjkjqkdvpvegnswijt.supabase.co/auth/v1/callback`
2. In Supabase, open **Authentication → Providers → Discord**. Enable Discord and enter the Discord application client ID and client secret there. Keep the client secret in Supabase; never put it in website code.
3. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://flightradar360.github.io/` and allow `https://flightradar360.github.io/` as a redirect URL.

The website starts Discord sign-in through Supabase with the `identify` scope. Supabase exchanges the OAuth code and redirects back to the site.

## Enable dashboard statistics

Run the updated [`flight-radar360-setup.sql`](./flight-radar360-setup.sql) in the Supabase SQL Editor. It is safe to rerun alongside the connected-aircraft setup. It adds per-account activity records and a rate-limited function for recording approved site events. Row-level security lets members read only their own activity; anonymous users cannot write or read dashboard stats.

The dashboard derives its counts from recorded events: account creation date, radar opens, Connected Users map opens, and active map minutes. Events start accumulating after the updated site is deployed and the SQL is applied; there are no seeded or sample counts.
