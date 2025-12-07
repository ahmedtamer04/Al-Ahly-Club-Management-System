"use client";

import { useState } from 'react';

export default function AddToCalendar({ event }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Download .ics file
  const handleDownloadICS = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/events/${event._id}/calendar`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to download calendar file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setShowDropdown(false);
    } catch (error) {
      console.error('Error downloading calendar:', error);
      alert(error.message || 'Failed to download calendar file');
    } finally {
      setDownloading(false);
    }
  };

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = () => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    // Format dates for Google Calendar (YYYYMMDDTHHmmss)
    const formatGoogleDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.name,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: event.short_description || '',
      location: event.location || '',
      trp: 'false' // Don't show the event as busy
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Generate Outlook Calendar URL
  const getOutlookCalendarUrl = () => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.name,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: event.short_description || '',
      location: event.location || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          padding: '8px 16px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.background = '#218838'}
        onMouseLeave={(e) => e.target.style.background = '#28a745'}
      >
        📅 Add to Calendar
      </button>

      {showDropdown && (
        <>
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '220px',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            <button
              onClick={handleDownloadICS}
              disabled={downloading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              <span style={{ fontSize: '18px' }}>💾</span>
              <span>{downloading ? 'Downloading...' : 'Download .ics file'}</span>
            </button>

            <div style={{ height: '1px', background: '#eee' }} />

            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowDropdown(false)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              <span style={{ fontSize: '18px' }}>📆</span>
              <span>Google Calendar</span>
            </a>

            <div style={{ height: '1px', background: '#eee' }} />

            <a
              href={getOutlookCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowDropdown(false)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              <span style={{ fontSize: '18px' }}>📧</span>
              <span>Outlook Calendar</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
