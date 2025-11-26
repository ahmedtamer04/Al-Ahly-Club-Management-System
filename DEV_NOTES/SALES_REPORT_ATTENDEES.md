# Sales Report — Attendees & Counts

Summary of change:

- The sales report now includes a clear count of attendees (all active registrations marked `status: 'registered'`) for each event. Previously the detailed counts filtered only paid/free registrations for the per-event registrations number.
- New fields returned by GET /api/sales-report:
  - report[].total_attendees — number of registered attendees for that event (all payment states)
  - report[].unpaid_registrations — number of 'pending' payment registrations for that event
  - totals.total_attendees — total attendees across filtered events
  - totals.total_unpaid_registrations — total unpaid registrations across filtered events

How to verify manually:

1. Create several registrations for an event using the API or frontend, with a mix of payment_status: 'paid', 'free', and 'pending'.
2. Call the endpoint as an Admin (or EventsOffice):

```
GET /api/sales-report
```

3. Confirm that:
  - `report[].total_attendees` equals the total number of registrations with status 'registered' for that event (regardless of payment_status).
  - `report[].paid_registrations` equals registrations with payment_status === 'paid'
  - `report[].free_registrations` equals registrations with payment_status === 'free'
  - `report[].unpaid_registrations` equals registrations with payment_status === 'pending'

If you'd like automated tests added for this endpoint I can add integration tests using an in-memory MongoDB instance — let me know and I'll include that next.
