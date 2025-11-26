# Admin — 'View Reports' button on All Events page

What I added
- A single '📊 View All Attendees' button was added to `frontend/app/admin/events/page.js` next to the sort/clear controls (not a per-event button). The button opens Admin → Sales Report and shows attendees for all events.

Behavior
- Clicking the button navigates to the Admin Sales Report view (no event_id) and shows attendees across all events.
- The Sales Report endpoint still supports `event_id` for per-event filtering, but the All Events table no longer shows a per-event button.

Notes about booth applications
- Some rows in the All Events table are transformed booth application objects (vendor applications). These use the application id for `_id`. The sales report API filters the `Event` collection so booth application IDs may not match an Event document — in that case the reports page will show no data. If you want per-booth application reports, I can add support for vendor-application report generation.

How to verify manually
1. Start backend and frontend.
2. Login as Admin and go to Admin → All Events.
3. Click the 📊 View All Attendees button next to the Sort controls. A popup/modal will open showing the Sales/Attendees report in-place (no page redirect). The modal displays summary totals and a per-event table.

Filters in the modal
- The modal has quick filters at the top — you can filter by:
	- Event name / description (text search)
	- Event type (Workshop, Trip, Bazaar, Booth, Conference)
	- Event date range (start_date and end_date) — this filters events that overlap the provided date window.
- Click Apply to run the filters, or Clear to reset.
4. Create a new event (via EventsOffice or Admin), then return to Admin → All Events — the new event row should render and the top-level Reports button should still be present and continue to show all attendees.

Follow-ups
- Add explicit per-type report handling for Booth vendor-applications.
- Add an 'Open per-event report in modal' option so admins don't need to navigate away.
