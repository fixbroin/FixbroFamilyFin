
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useExpenses, useEarnings, useShoppingItems } from './useFamilyData';

export function useNotifications() {
    const { user } = useAuth();
    const { data: expenses, loading: expensesLoading } = useExpenses();
    const { data: earnings, loading: earningsLoading } = useEarnings();
    const { data: shoppingItems, loading: itemsLoading } = useShoppingItems();
    const [lastCleared, setLastCleared] = useState<number>(0);

    useEffect(() => {
        const storedTimestamp = localStorage.getItem('lastClearedNotifications');
        if (storedTimestamp) {
            setLastCleared(Number(storedTimestamp));
        } else {
            // If it's the first time, set the clear time to now to avoid showing all history
            setLastCleared(Date.now());
        }
    }, []);

    const allActivities = useMemo(() => {
        if (!user) return [];
        
        const mappedShopping = shoppingItems
            .filter(i => i.createdAt)
            .map(item => ({ ...item, type: 'shopping' as const, activityTime: item.createdAt.toDate() }));
        const mappedExpenses = expenses
            .filter(i => i.createdAt)
            .map(item => ({ ...item, type: 'expense' as const, activityTime: item.createdAt.toDate() }));
        const mappedEarnings = earnings
            .filter(i => i.createdAt)
            .map(item => ({ ...item, type: 'earning' as const, activityTime: item.createdAt.toDate() }));
        
        return [...mappedShopping, ...mappedExpenses, ...mappedEarnings]
            .sort((a, b) => b.activityTime.getTime() - a.activityTime.getTime());

    }, [shoppingItems, expenses, earnings, user]);
    
    const notifications = useMemo(() => {
        if (!user) return [];
        return allActivities
            .filter(item => item.addedBy !== user?.uid)
            .filter(item => item.activityTime.getTime() > lastCleared);
    }, [allActivities, user, lastCleared]);
    
    const clearNotifications = useCallback(() => {
        const now = Date.now();
        localStorage.setItem('lastClearedNotifications', now.toString());
        setLastCleared(now);
    }, []);

    const loading = expensesLoading || earningsLoading || itemsLoading;

    return { notifications, notificationCount: notifications.length, clearNotifications, loading };
}
