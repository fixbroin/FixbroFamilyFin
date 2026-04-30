
"use client";

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses, useEarnings, useExpenseCategories, useEarningCategories, useCreditCardSpends } from '@/hooks/useFamilyData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { format, subMonths, getMonth, getYear, startOfMonth, addMonths, endOfMonth } from 'date-fns';
import { TrendingUp, TrendingDown, Wallet, User, ArrowDownCircle, ArrowUpCircle, Lock, MinusCircle, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import type { Expense, Earning } from '@/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

function IndividualSummary() {
    const { user, family } = useAuth();
    const [displayDate, setDisplayDate] = useState(new Date());

    const { startDate, endDate, currentMonthStart } = useMemo(() => ({
        startDate: startOfMonth(subMonths(displayDate, 5)),
        currentMonthStart: startOfMonth(displayDate),
        endDate: endOfMonth(displayDate)
    }), [displayDate]);

    const { data: allExpenses, loading: expensesLoading } = useExpenses(startDate, endDate);
    const { data: allEarnings, loading: earningsLoading } = useEarnings(startDate, endDate);
    const { data: allCCSpends, loading: ccLoading } = useCreditCardSpends(currentMonthStart, endDate);
    
    const { data: expenseCategories, loading: expenseCatLoading } = useExpenseCategories();
    const { data: earningCategories, loading: earningCatLoading } = useEarningCategories();
    
    const currencySymbol = useMemo(() => family?.currencySymbol || '₹', [family]);

    const { individualExpenses, individualEarnings, individualCCSpends } = useMemo(() => {
        if (!user) return { individualExpenses: [], individualEarnings: [], individualCCSpends: [] };
        const myExpenses = allExpenses.filter(expense => expense.addedBy === user.uid);
        const myEarnings = allEarnings.filter(earning => earning.addedBy === user.uid);
        const myCCSpends = allCCSpends.filter(spend => spend.addedBy === user.uid);
        return { individualExpenses: myExpenses, individualEarnings: myEarnings, individualCCSpends: myCCSpends };
    }, [allExpenses, allEarnings, allCCSpends, user]);

    const { monthlyExpenses, monthlyEarnings, monthlyCCSpends, balance } = useMemo(() => {
        const currentMonth = displayDate.getMonth();
        const currentYear = displayDate.getFullYear();

        const currentMonthExpenses = individualExpenses
            .filter(e => e.date.toDate().getMonth() === currentMonth && e.date.toDate().getFullYear() === currentYear)
            .reduce((acc, expense) => acc + expense.amount, 0);

        const currentMonthEarnings = individualEarnings
            .filter(e => e.date.toDate().getMonth() === currentMonth && e.date.toDate().getFullYear() === currentYear)
            .reduce((acc, earning) => acc + earning.amount, 0);

        const currentMonthCCSpends = individualCCSpends.reduce((acc, spend) => acc + spend.amount, 0);

        return { 
            monthlyExpenses: currentMonthExpenses, 
            monthlyEarnings: currentMonthEarnings, 
            monthlyCCSpends: currentMonthCCSpends,
            balance: currentMonthEarnings - currentMonthExpenses 
        };
    }, [individualExpenses, individualEarnings, individualCCSpends, displayDate]);
    
    const chartData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => subMonths(displayDate, 5 - i));
        const data = months.map(month => ({
            name: format(month, 'MMM'),
            year: getYear(month),
            month: getMonth(month),
            Expenses: 0,
            Earnings: 0,
        }));

        individualExpenses.forEach(expense => {
            const expenseDate = expense.date.toDate();
            const expenseMonth = getMonth(expenseDate);
            const expenseYear = getYear(expenseDate);
            const monthData = data.find(d => d.month === expenseMonth && d.year === expenseYear);
            if (monthData) {
                monthData.Expenses += expense.amount;
            }
        });

        individualEarnings.forEach(earning => {
            const earningDate = earning.date.toDate();
            const earningMonth = getMonth(earningDate);
            const earningYear = getYear(earningDate);
            const monthData = data.find(d => d.month === earningMonth && d.year === earningYear);
            if (monthData) {
                monthData.Earnings += earning.amount;
            }
        });

        return data;
    }, [individualExpenses, individualEarnings, displayDate]);

    const expenseCategoriesMap = useMemo(() => {
        return expenseCategories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {} as Record<string, string>);
    }, [expenseCategories]);
    
    const earningCategoriesMap = useMemo(() => {
        return earningCategories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {} as Record<string, string>);
    }, [earningCategories]);

    const recentExpenses = useMemo(() => {
        const currentMonth = displayDate.getMonth();
        const currentYear = displayDate.getFullYear();
        return individualExpenses.filter(item => {
            const itemDate = item.date.toDate();
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        });
   }, [individualExpenses, displayDate]);

   const recentEarnings = useMemo(() => {
        const currentMonth = displayDate.getMonth();
        const currentYear = displayDate.getFullYear();
        return individualEarnings.filter(item => {
            const itemDate = item.date.toDate();
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        });
   }, [individualEarnings, displayDate]);

    const loading = expensesLoading || earningsLoading || expenseCatLoading || earningCatLoading || ccLoading;
    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader className="h-16 w-16" /></div>;
    }

    const goToPreviousMonth = () => setDisplayDate(prev => subMonths(prev, 1));
    const goToNextMonth = () => setDisplayDate(prev => addMonths(prev, 1));
    const isNextMonthDisabled = getMonth(displayDate) === getMonth(new Date()) && getYear(displayDate) === getYear(new Date());

    const renderTransactionItem = (item: Expense | Earning, type: 'expense' | 'earning') => {
        const categoriesMap = type === 'expense' ? expenseCategoriesMap : earningCategoriesMap;
        return (
             <div className="flex items-center gap-4 py-2">
                <div className="flex-shrink-0">
                    {type === 'earning' ? <ArrowUpCircle className="h-6 w-6 text-emerald-500" /> : <ArrowDownCircle className="h-6 w-6 text-rose-500" />}
                </div>
                <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.name}</p>
                    <p className={cn("font-semibold", type === 'earning' ? 'text-emerald-500' : 'text-rose-500')}>
                        {type === 'earning' ? '+' : '-'}{currencySymbol}{item.amount.toFixed(2)}
                    </p>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                    <span>{categoriesMap[item.categoryId] || 'Uncategorized'}</span>
                    {item.isPrivate && <Lock className="h-3 w-3" />}
                    </div>
                    <span>{item.date ? format(item.date.toDate(), "MMM d, yyyy") : 'No date'}</span>
                </div>
                </div>
            </div>
        )
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold">Summary for {format(displayDate, 'MMMM yyyy')}</h2>
                    <p className="text-muted-foreground">Your personal financial summary for the selected month.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={isNextMonthDisabled}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{monthlyEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{monthlyExpenses.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CC Spends</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{monthlyCCSpends.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", balance >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {currencySymbol}{balance.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Your 6-Month Contribution</CardTitle>
                    <CardDescription>A summary of your personal earnings and expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(value: number, name: string) => [`${currencySymbol}${value.toFixed(2)}`, name]}
                            />
                            <Legend iconType="circle" />
                            <Bar dataKey="Earnings" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Recent Expenses</CardTitle>
                        <CardDescription>Your personal expenses from this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentExpenses.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">You have no recent expenses.</p>
                        ) : (
                        <div className="space-y-2">
                            {recentExpenses.map((item, index) => (
                            <div key={item.id}>
                                {renderTransactionItem(item, 'expense')}
                                {index < recentExpenses.length - 1 && <Separator />}
                            </div>
                            ))}
                        </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Recent Earnings</CardTitle>
                        <CardDescription>Your personal earnings from this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentEarnings.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">You have no recent earnings.</p>
                        ) : (
                        <div className="space-y-2">
                            {recentEarnings.map((item, index) => (
                            <div key={item.id}>
                                {renderTransactionItem(item, 'earning')}
                                {index < recentEarnings.length - 1 && <Separator />}
                            </div>
                            ))}
                        </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function IndividualPage() {
    const { userProfile, loading } = useAuth();
  
    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-background"><Loader className="h-16 w-16" /></div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Your Individual Finances</h1>
            </div>
            <p className="text-muted-foreground">Here is your personal financial dashboard.</p>
            <IndividualSummary />
        </div>
        </div>
    );
}
