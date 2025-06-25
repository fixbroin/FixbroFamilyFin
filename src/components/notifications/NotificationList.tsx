"use client";

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses, useEarnings, useShoppingItems, useFamilyMembers } from '@/hooks/useFamilyData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingBag, CreditCard, Landmark, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';

const iconMap = {
    shopping: <ShoppingBag className="h-5 w-5 text-primary-foreground" />,
    expense: <CreditCard className="h-5 w-5 text-primary-foreground" />,
    earning: <Landmark className="h-5 w-5 text-primary-foreground" />,
};

const getNotificationText = (item: any, userName: string, type: 'shopping' | 'expense' | 'earning') => {
    switch (type) {
        case 'shopping':
            if (item.purchased) {
                return `${userName} marked "${item.name}" as purchased.`;
            }
            return `${userName} added "${item.name}" to the shopping list.`;
        case 'expense':
            return `${userName} added a new expense: "${item.name}" for Rs ${item.amount.toFixed(2)}.`;
        case 'earning':
            return `${userName} added a new earning: "${item.name}" for Rs ${item.amount.toFixed(2)}.`;
        default:
            return '';
    }
};

export function NotificationList() {
    const { user } = useAuth();
    const { data: members, loading: membersLoading } = useFamilyMembers();
    const { data: expenses, loading: expensesLoading } = useExpenses();
    const { data: earnings, loading: earningsLoading } = useEarnings();
    const { data: shoppingItems, loading: itemsLoading } = useShoppingItems();
    const [lastCleared, setLastCleared] = useState<number>(0);

    useEffect(() => {
        const storedTimestamp = localStorage.getItem('lastClearedNotifications');
        if (storedTimestamp) {
            setLastCleared(Number(storedTimestamp));
        }
    }, []);

    const membersMap = useMemo(() => {
        return members.reduce((acc, member) => {
            acc[member.uid] = member.name || "A family member";
            return acc;
        }, {} as Record<string, string>);
    }, [members]);

    const allActivities = useMemo(() => {
        const mappedShopping = shoppingItems.map(item => ({ ...item, type: 'shopping' as const }));
        const mappedExpenses = expenses.map(item => ({ ...item, type: 'expense' as const }));
        const mappedEarnings = earnings.map(item => ({ ...item, type: 'earning' as const }));

        return [...mappedShopping, ...mappedExpenses, ...mappedEarnings]
            .filter(item => item.addedBy !== user?.uid)
            .filter(item => item.createdAt.toDate().getTime() > lastCleared)
            .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

    }, [shoppingItems, expenses, earnings, user?.uid, lastCleared]);

    const handleClearAll = () => {
        const now = Date.now();
        localStorage.setItem('lastClearedNotifications', now.toString());
        setLastCleared(now);
    };

    const loading = membersLoading || expensesLoading || earningsLoading || itemsLoading;

    if (loading) {
        return <div className="flex justify-center mt-8"><Loader /></div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Family Activity</CardTitle>
                    <CardDescription>Here's what your family has been up to.</CardDescription>
                </div>
                {allActivities.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleClearAll}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {allActivities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No new activity to show.</p>
                ) : (
                    <div className="space-y-2">
                        {allActivities.map((item, index) => (
                            <div key={`${item.type}-${item.id}`}>
                                <div className="flex items-start gap-4 p-2">
                                    <div className="p-3 bg-primary/80 rounded-full mt-1">
                                        {iconMap[item.type]}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm">
                                            {getNotificationText(item, membersMap[item.addedBy] || 'Someone', item.type)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                {index < allActivities.length - 1 && <Separator />}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
