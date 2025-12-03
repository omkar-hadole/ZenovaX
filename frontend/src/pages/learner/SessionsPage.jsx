import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import BrowseSessionsView from '../../components/dashboard/learner/BrowseSessionsView';

export default function SessionsPage() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isMoreLoading, setIsMoreLoading] = useState(false);

    const fetchSessions = async (pageNum = 1, reset = false) => {
        try {
            if (pageNum > 1) setIsMoreLoading(true);
            else setIsLoading(true);

            const data = await apiCall(`/sessions/all?page=${pageNum}&limit=9`);

            if (reset) {
                setSessions(data.sessions || []);
            } else {
                setSessions(prev => [...prev, ...(data.sessions || [])]);
            }

            setHasMore(data.pagination?.page < data.pagination?.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setIsMoreLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions(1, true);
    }, []);

    const loadMoreSessions = () => {
        if (!isMoreLoading && hasMore) {
            fetchSessions(page + 1);
        }
    };

    const setSelectedSession = (session) => {
        if (session) {
            navigate(`/sessions/${session.id}`);
        }
    };

    return (
        <BrowseSessionsView
            sessions={sessions}
            isLoading={isLoading}
            setSelectedSession={setSelectedSession}
            onLoadMore={loadMoreSessions}
            hasMore={hasMore}
            isMoreLoading={isMoreLoading}
        />
    );
}
