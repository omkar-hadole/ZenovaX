import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import MyBookingsView from '../../components/dashboard/learner/MyBookingsView';
import InlineError from '../../components/InlineError';

export default function BookingsPage() {
    const navigate = useNavigate();
    const [myBookings, setMyBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);

    const [statusFilter, setStatusFilter] = useState('all');
    const [modeFilter, setModeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // Debounce the raw input before it drives a fetch, so typing doesn't
    // fire a request per keystroke.
    useEffect(() => {
        const timeout = setTimeout(() => setSearch(searchInput.trim()), 400);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const fetchMyBookings = async (pageNum = 1, status = statusFilter, mode = modeFilter, searchTerm = search) => {
        setIsLoading(true);
        setError(null);
        try {
            let query = `/sessions/my-bookings?page=${pageNum}&limit=9&status=${status}`;
            if (mode) query += `&mode=${mode}`;
            if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;

            const data = await apiCall(query);
            setMyBookings(data.sessions || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setPage(pageNum);
        } catch (error) {
            console.error(error);
            setError(error.message || 'Failed to fetch bookings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Reset to page 1 whenever a filter changes
        fetchMyBookings(1, statusFilter, modeFilter, search);
    }, [statusFilter, modeFilter, search]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchMyBookings(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const setSelectedSession = (session) => {
        if (session) {
            navigate(`/sessions/${session.id}`);
        }
    };

    const setActiveTab = (tab) => {
        if (tab === 'Browse Sessions') navigate('/sessions');
    };

    if (error) {
        return (
            <div className="p-4 sm:p-8">
                <InlineError message={error} onRetry={() => fetchMyBookings(page)} />
            </div>
        );
    }

    return (
        <MyBookingsView
            myBookings={myBookings}
            isLoading={isLoading}
            setSelectedSession={setSelectedSession}
            setActiveTab={setActiveTab}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            modeFilter={modeFilter}
            setModeFilter={setModeFilter}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
        />
    );
}
