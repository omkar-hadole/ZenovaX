import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import BrowseSessionsView from '../../components/dashboard/learner/BrowseSessionsView';
import InlineError from '../../components/InlineError';

export default function SessionsPage() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterType, setFilterType] = useState('upcoming');
    const [filters, setFilters] = useState({ mode: '', priceType: '' });
    const [error, setError] = useState(null);

    const fetchSessions = async (pageNum = 1, type = filterType, currentFilters = filters) => {
        try {
            setIsLoading(true);
            setError(null);

            let query = `/sessions/all?page=${pageNum}&limit=9&type=${type}`;
            if (currentFilters.mode) query += `&mode=${currentFilters.mode}`;
            if (currentFilters.priceType) query += `&priceType=${currentFilters.priceType}`;

            const data = await apiCall(query);

            setSessions(data.sessions || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setPage(pageNum);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to fetch sessions');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Reset to page 1 when filter changes
        fetchSessions(1, filterType, filters);
    }, [filterType, filters]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchSessions(newPage, filterType, filters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const setSelectedSession = (session) => {
        if (session) {
            navigate(`/sessions/${session.id}`);
        }
    };

    if (isLoading) {
        return (
            <BrowseSessionsView
                sessions={[]}
                isLoading={true}
                setSelectedSession={setSelectedSession}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                filterType={filterType}
                setFilterType={setFilterType}
                filters={filters}
                setFilters={setFilters}
            />
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <InlineError message={error} onRetry={() => fetchSessions(page, filterType, filters)} />
            </div>
        );
    }

    return (
        <BrowseSessionsView
            sessions={sessions}
            isLoading={isLoading}
            setSelectedSession={setSelectedSession}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            filterType={filterType}
            setFilterType={setFilterType}
            filters={filters}
            setFilters={setFilters}
        />
    );
}
