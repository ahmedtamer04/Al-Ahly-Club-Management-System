# 📋 Event Types - Complete List

## ✅ All Event Types in Al-Ahly Platform

Based on the backend models and routes, the system supports **6 event types**:

### 1. 🎨 **Workshop**
- Educational/skill-building events
- Routes: `workshopRoutes.js`
- Create page: `/eventsoffice/workshops/create/page.js`
- Browsing: `/student/workshops/page.js`

### 2. 🚌 **Trip**
- Organized travel events
- Routes: `tripRoutes.js`
- Create page: `/eventsoffice/trips/create/page.js`
- Browsing: `/student/trips/page.js`

### 3. 🎪 **Bazaar**
- Market/vendor events
- Routes: `bazaarRoutes.js`
- Create page: `/eventsoffice/bazaars/create/page.js`
- Vendor application: `/vendor/apply-bazaar/page.js`

### 4. 🏟️ **Booth** (Platform Event)
- Exhibition/display spaces
- Routes: `bazaarRoutes.js` (booth platform functions)
- Application: `/vendor/apply-booth/page.js`

### 5. 🎓 **Conference**
- Academic/professional conferences
- Routes: `conferenceRoutes.js`
- Create page: `/professor/create/page.js`
- Browsing: `/professor/conferences/page.js`

### 6. 🏋️ **Gym Session**
- Fitness/sports sessions
- Routes: `gymSessionsRoutes.js`
- Create page: `/eventsoffice/gym/page.js`
- Schedule view: `/student/gym/schedule/page.js`

---

## 📄 Updated Pages with All Event Types

### Admin Section
✅ `/admin/events/page.js`
- Stats cards: All 6 event types
- Filter buttons: All 6 event types
- Table view with type column

### Student Section
✅ `/student/events/page.js`
- Filter buttons: All 6 event types
- Browse all available events

✅ `/student/events/search/page.js`
- Event type dropdown: All 6 event types
- Advanced filtering

### EventsOffice Section
✅ `/eventsoffice/create/page.js`
- Event type selector: All 6 event types
- Quick creation form

---

## 🎨 Event Type Icons

| Type | Icon | Color Theme |
|------|------|-------------|
| Workshop | 🎨 | Creative/Educational |
| Trip | 🚌 | Travel/Adventure |
| Bazaar | 🎪 | Market/Festival |
| Booth | 🏟️ | Exhibition/Display |
| Conference | 🎓 | Academic/Professional |
| Gym Session | 🏋️ | Fitness/Sports |

---

## 📊 Stats Dashboard Layout

All admin/events pages now show:
```
🎨 Workshops    🚌 Trips       🎪 Bazaars
🏟️ Booths       🎓 Conferences  🏋️ Gym Sessions
```

6 cards in 3x2 grid layout

---

## ✅ Filter Buttons Order

Consistent across all pages:
1. All Events
2. Workshops
3. Trips
4. Bazaars
5. Booths
6. Conferences
7. Gym Sessions

---

## 🔄 Backend Integration

When connecting to backend, use these event type values:
- `"Workshop"`
- `"Trip"`
- `"Bazaar"`
- `"Booth"`
- `"Conference"`
- `"GymSession"` (note: camelCase for gym session)

---

## 📝 Notes

- **Booth** is a special type of platform event
- Vendors can apply to both Bazaars and Booths
- All event types share common fields (title, description, date, location)
- Each type has specific fields based on its nature
- Unified event model in backend handles all types

---

**Last Updated:** October 15, 2025  
**Status:** ✅ All 6 event types fully implemented in frontend
