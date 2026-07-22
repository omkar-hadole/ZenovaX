import { stripMarkdown } from './descriptionFormatter';

function toICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICSText(text) {
    return String(text || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

function getSessionTimes(session) {
    const start = new Date(session.scheduledAt);
    const end = new Date(start.getTime() + (session.duration || 60) * 60000);
    return { start, end };
}

function getSessionLocation(session) {
    if (session.mode === 'OFFLINE') return session.venue || 'In-person session';
    return session.meetingLink || 'Online session';
}

function getSessionDescription(session) {
    return [
        session.mentor?.name ? `Mentor: ${session.mentor.name}` : null,
        stripMarkdown(session.description || ''),
    ].filter(Boolean).join('\n\n');
}

export function buildICSContent(session) {
    const { start, end } = getSessionTimes(session);
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ZenovaX//Session Calendar//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:zenovax-session-${session.id}@zenovax.app`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${escapeICSText(session.title || 'ZenovaX Session')}`,
        `DESCRIPTION:${escapeICSText(getSessionDescription(session))}`,
        `LOCATION:${escapeICSText(getSessionLocation(session))}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ];
    return lines.join('\r\n');
}

export function downloadICS(session) {
    const content = buildICSContent(session);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (session.title || 'session').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    link.download = `${safeTitle}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(session) {
    const { start, end } = getSessionTimes(session);
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: session.title || 'ZenovaX Session',
        dates: `${toICSDate(start)}/${toICSDate(end)}`,
        details: getSessionDescription(session),
        location: getSessionLocation(session),
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
