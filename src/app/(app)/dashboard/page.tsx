
"use client";

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses, useEarnings, useExpenseCategories, useEarningCategories, useFamilyMembers, useCreditCardSpends } from '@/hooks/useFamilyData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, getMonth, getYear, startOfMonth, addMonths, endOfMonth } from 'date-fns';
import { TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle, Lock, MinusCircle, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import type { Expense, Earning } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';


function FinancialSummary() {
    const { user, family } = useAuth();
    const [displayDate, setDisplayDate] = useState(new Date());

    const { startDate, endDate, currentMonthStart } = useMemo(() => ({
        startDate: startOfMonth(subMonths(displayDate, 5)),
        currentMonthStart: startOfMonth(displayDate),
        endDate: endOfMonth(displayDate)
    }), [displayDate]);

    // Fetch 6 months of data to restore the 6-month overview chart
    const { data: expenses, loading: expensesLoading } = useExpenses(startDate, endDate);
    const { data: earnings, loading: earningsLoading } = useEarnings(startDate, endDate);
    const { data: creditCardSpends, loading: ccLoading } = useCreditCardSpends(currentMonthStart, endDate);
    
    const { data: expenseCategories, loading: expenseCatLoading } = useExpenseCategories();
    const { data: earningCategories, loading: earningCatLoading } = useEarningCategories();
    const { data: members, loading: membersLoading } = useFamilyMembers();

    const currencySymbol = useMemo(() => family?.currencySymbol || '₹', [family]);

    const hiddenUserIds = useMemo(() => {
        return new Set(members.filter(m => m.isFinancialDataHidden).map(m => m.uid));
    }, [members]);

    const { visibleExpenses, visibleEarnings, visibleCCSpends } = useMemo(() => {
        if (!user) return { visibleExpenses: [], visibleEarnings: [], visibleCCSpends: [] };
        
        const myVisibleExpenses = expenses.filter(expense => 
            (!hiddenUserIds.has(expense.addedBy) || expense.addedBy === user.uid) &&
            (!expense.isPrivate || expense.addedBy === user.uid)
        );
        
        const myVisibleEarnings = earnings.filter(earning => 
            (!hiddenUserIds.has(earning.addedBy) || earning.addedBy === user.uid) &&
            (!earning.isPrivate || earning.addedBy === user.uid)
        );

        const myVisibleCCSpends = creditCardSpends.filter(spend => 
            (!hiddenUserIds.has(spend.addedBy) || spend.addedBy === user.uid) &&
            (!spend.isPrivate || spend.addedBy === user.uid)
        );

        return { 
            visibleExpenses: myVisibleExpenses, 
            visibleEarnings: myVisibleEarnings,
            visibleCCSpends: myVisibleCCSpends
        };
    }, [expenses, earnings, creditCardSpends, user, hiddenUserIds]);

    const { monthlyExpenses, monthlyEarnings, monthlyCCSpends, balance } = useMemo(() => {
        const currentMonth = displayDate.getMonth();
        const currentYear = displayDate.getFullYear();

        const currentMonthExpenses = visibleExpenses
            .filter(e => e.date.toDate().getMonth() === currentMonth && e.date.toDate().getFullYear() === currentYear)
            .reduce((acc, expense) => acc + expense.amount, 0);

        const currentMonthEarnings = visibleEarnings
            .filter(e => e.date.toDate().getMonth() === currentMonth && e.date.toDate().getFullYear() === currentYear)
            .reduce((acc, earning) => acc + earning.amount, 0);

        const currentMonthCCSpends = visibleCCSpends
            .filter(s => s.date.toDate().getMonth() === currentMonth && s.date.toDate().getFullYear() === currentYear)
            .reduce((acc, spend) => acc + spend.amount, 0);

        return { 
            monthlyExpenses: currentMonthExpenses, 
            monthlyEarnings: currentMonthEarnings, 
            monthlyCCSpends: currentMonthCCSpends,
            balance: currentMonthEarnings - currentMonthExpenses 
        };
    }, [visibleExpenses, visibleEarnings, visibleCCSpends, displayDate]);

    const chartData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => subMonths(displayDate, 5 - i));
        const data = months.map(month => ({
            name: format(month, 'MMM'),
            year: getYear(month),
            month: getMonth(month),
            Expenses: 0,
            Earnings: 0,
        }));

        visibleExpenses.forEach(expense => {
            const expenseDate = expense.date.toDate();
            const expenseMonth = getMonth(expenseDate);
            const expenseYear = getYear(expenseDate);
            const monthData = data.find(d => d.month === expenseMonth && d.year === expenseYear);
            if (monthData) {
                monthData.Expenses += expense.amount;
            }
        });

        visibleEarnings.forEach(earning => {
            const earningDate = earning.date.toDate();
            const earningMonth = getMonth(earningDate);
            const earningYear = getYear(earningDate);
            const monthData = data.find(d => d.month === earningMonth && d.year === earningYear);
            if (monthData) {
                monthData.Earnings += earning.amount;
            }
        });

        return data;
    }, [visibleExpenses, visibleEarnings, displayDate]);
    
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

    const budgetData = useMemo(() => {
        const currentMonth = displayDate.getMonth();
        const currentYear = displayDate.getFullYear();
        const categorySpending: Record<string, number> = {};

        visibleExpenses
            .filter(e => e.date.toDate().getMonth() === currentMonth && e.date.toDate().getFullYear() === currentYear)
            .forEach(exp => {
                categorySpending[exp.categoryId] = (categorySpending[exp.categoryId] || 0) + exp.amount;
            });

        return expenseCategories
            .filter(cat => cat.budget && cat.budget > 0)
            .map(cat => {
                const spent = categorySpending[cat.id] || 0;
                const budget = cat.budget || 0;
                const percentage = Math.min((spent / budget) * 100, 100);
                return {
                    ...cat,
                    spent,
                    percentage,
                    isOverBudget: spent > budget
                };
            });
    }, [visibleExpenses, expenseCategories, displayDate]);

    const recentExpenses = useMemo(() => {
        if (!user) return [];
        const currentMonth = displayDate.getMonth();
        const currentYear = displayDate.getFullYear();

        return visibleExpenses
           .filter(item => {
                const itemDate = item.date.toDate();
                return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
           })
           .filter(item => !item.isPrivate || item.addedBy === user.uid);
   }, [visibleExpenses, user, displayDate]);

   const recentEarnings = useMemo(() => {
        if (!user) return [];
        const currentMonth = displayDate.getMonth();
        const currentYear = displayDate.getFullYear();

        return visibleEarnings
           .filter(item => {
                const itemDate = item.date.toDate();
                return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
           })
           .filter(item => !item.isPrivate || item.addedBy === user.uid);
   }, [visibleEarnings, user, displayDate]);

    const loading = expensesLoading || earningsLoading || expenseCatLoading || earningCatLoading || membersLoading || ccLoading;
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
                    {type === 'earning' ? (
                        <div className="p-2 rounded-full bg-emerald-500/10">
                            <ArrowUpCircle className="h-6 w-6 text-emerald-500" />
                        </div>
                    ) : (
                        <div className="p-2 rounded-full bg-rose-500/10">
                            <ArrowDownCircle className="h-6 w-6 text-rose-500" />
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className={cn("font-bold text-lg", type === 'earning' ? 'text-emerald-500' : 'text-rose-500')}>
                            {type === 'earning' ? '+' : '-'}{currencySymbol}{item.amount.toFixed(2)}
                        </p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span className="bg-muted px-2 py-0.5 rounded-md text-xs font-medium">
                                {categoriesMap[item.categoryId] || 'Uncategorized'}
                            </span>
                            {item.isPrivate && <Lock className="h-3 w-3" />}
                        </div>
                        <span className="text-xs">{item.date ? format(item.date.toDate(), "MMM d, yyyy") : 'No date'}</span>
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-headline">Summary for {format(displayDate, 'MMMM yyyy')}</h2>
                    <p className="text-muted-foreground">Your family's financial dashboard.</p>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-full border border-gray-200">
    
    <Button 
        variant="soft" 
        size="icon" 
        onClick={goToPreviousMonth} 
        className="h-8 w-8 rounded-full"
    >
        <ChevronLeft className="h-4 w-4" />
    </Button>

    <div className="flex items-center px-3 text-xs font-semibold text-gray-800">
        {format(displayDate, 'MMM yyyy')}
    </div>

    <Button 
        variant="soft" 
        size="icon" 
        onClick={goToNextMonth} 
        disabled={isNextMonthDisabled} 
        className="h-8 w-8 rounded-full"
    >
        <ChevronRight className="h-4 w-4" />
    </Button>

</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Earnings</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{currencySymbol}{monthlyEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className="border-rose-500/20 bg-rose-500/[0.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-500">{currencySymbol}{monthlyExpenses.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className="border-orange-500/20 bg-orange-500/[0.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CC Spends</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">{currencySymbol}{monthlyCCSpends.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className={cn("border-muted shadow-sm", balance >= 0 ? "border-emerald-500/20 bg-emerald-500/[0.01]" : "border-rose-500/20 bg-rose-500/[0.01]")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Savings</CardTitle>
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
                    <CardTitle className="text-lg font-bold">Last 6 Months Overview</CardTitle>
                    <CardDescription>A summary of your family's recent earnings and expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis 
                                dataKey="name" 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `${currencySymbol}${value}`} 
                            />
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--background))', 
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                                cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                                formatter={(value: number, name: string) => [`${currencySymbol}${value.toFixed(2)}`, name]}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="Earnings" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {budgetData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Budgets</CardTitle>
                        <CardDescription>Track your spending against your set monthly limits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            {budgetData.map((budget) => (
                                <div key={budget.id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{budget.name}</span>
                                        <span className={cn("font-bold", budget.isOverBudget ? "text-rose-500" : "text-muted-foreground")}>
                                            {currencySymbol}{budget.spent.toFixed(0)} / {currencySymbol}{budget.budget?.toFixed(0)}
                                        </span>
                                    </div>
                                    <Progress 
                                        value={budget.percentage} 
                                        className={cn(
                                            "h-2",
                                            budget.percentage > 90 ? "[&>div]:bg-rose-500" : 
                                            budget.percentage > 70 ? "[&>div]:bg-orange-500" : 
                                            "[&>div]:bg-emerald-500"
                                        )} 
                                    />
                                    <p className="text-[10px] text-muted-foreground text-right italic">
                                        {budget.isOverBudget 
                                            ? `Over by ${currencySymbol}${(budget.spent - (budget.budget || 0)).toFixed(0)}!` 
                                            : `${(100 - budget.percentage).toFixed(0)}% remaining`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Expenses</CardTitle>
                        <CardDescription>Your expenses from this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentExpenses.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No recent expenses.</p>
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
                        <div className="mt-4 pt-2 border-t text-center">
                            <Button variant="link" asChild>
                                <Link href="/expenses">View All Expenses</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Earnings</CardTitle>
                        <CardDescription>Your earnings from this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentEarnings.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No recent earnings.</p>
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
                        <div className="mt-4 pt-2 border-t text-center">
                            <Button variant="link" asChild>
                                <Link href="/earnings">View All Earnings</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function DashboardPage() {
  const { userProfile, loading } = useAuth();
  
  if (loading) {
      return <div className="flex h-screen items-center justify-center bg-background"><Loader className="h-16 w-16" /></div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold font-headline">Welcome, {userProfile?.name}!</h1>
        <p className="text-muted-foreground">Here is your family's financial dashboard.</p>
        <FinancialSummary />
      </div>
    </div>
  );
}
