
"use client";

import { useMemo } from 'react';
import { useFamilyMembers } from '@/hooks/useFamilyData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingBag, CreditCard, Landmark, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useNotifications } from '@/hooks/useNotifications';

const iconMap = {
    shopping: <ShoppingBag className="h-5 w-5 text-primary-foreground" />,
    expense: <CreditCard className="h-5 w-5 text-primary-foreground" />,
    earning: <Landmark className="h-5 w-5 text-primary-foreground" />,
};

const getNotificationText = (item: any, userName: string, type: 'shopping' | 'expense' | 'earning', currencySymbol: string) => {
    switch (type) {
        case 'shopping':
            if (item.purchased) {
                return `${userName} marked "${item.name}" as purchased.`;
            }
            return `${userName} added "${item.name}" to the shopping list.`;
        case 'expense':
            return `${userName} added a new expense: "${item.name}" for ${currencySymbol}${item.amount.toFixed(2)}.`;
        case 'earning':
            return `${userName} added a new earning: "${item.name}" for ${currencySymbol}${item.amount.toFixed(2)}.`;
        default:
            return '';
    }
};

export function NotificationList() {
    const { family } = useAuth();
    const { data: members, loading: membersLoading } = useFamilyMembers();
    const { notifications, clearNotifications, loading: notificationsLoading } = useNotifications();

    const currencySymbol = useMemo(() => family?.currencySymbol || '$', [family]);

    const membersMap = useMemo(() => {
        return members.reduce((acc, member) => {
            acc[member.uid] = member.name || "A family member";
            return acc;
        }, {} as Record<string, string>);
    }, [members]);

    const handleClearAll = () => {
        clearNotifications();
    };

    const loading = membersLoading || notificationsLoading;

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
                {notifications.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleClearAll}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No new activity to show.</p>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((item, index) => (
                            <div key={`${item.type}-${item.id}`}>
                                <div className="flex items-start gap-4 p-2">
                                    <div className="p-3 bg-primary/80 rounded-full mt-1">
                                        {iconMap[item.type]}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm">
                                            {getNotificationText(item, membersMap[item.addedBy] || 'Someone', item.type, currencySymbol)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                </div>
                                {index < notifications.length - 1 && <Separator />}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
