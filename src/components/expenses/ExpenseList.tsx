
"use client";

import { useMemo, useState } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses, useExpenseCategories, useFamilyMembers } from "@/hooks/useFamilyData";
import type { Expense } from "@/types";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/components/ui/loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function ExpenseList() {
  const { user, family } = useAuth();
  const [displayDate, setDisplayDate] = useState(new Date());

  const { startDate, endDate } = useMemo(() => ({
    startDate: startOfMonth(displayDate),
    endDate: endOfMonth(displayDate)
  }), [displayDate]);

  const { data: expenses, loading: expensesLoading } = useExpenses(startDate, endDate);
  const { data: categories, loading: categoriesLoading } = useExpenseCategories();
  const { data: members, loading: membersLoading } = useFamilyMembers();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);

  const currencySymbol = useMemo(() => family?.currencySymbol || '₹', [family]);

  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const filteredExpenses = useMemo(() => {
    if (!user) return [];
    const hiddenUserIds = new Set(members.filter(m => m.isFinancialDataHidden).map(m => m.uid));
    
    return expenses
      .filter(exp => !hiddenUserIds.has(exp.addedBy) || exp.addedBy === user.uid)
      .filter(exp => !exp.isPrivate || exp.addedBy === user.uid);
  }, [expenses, user, members]);

  const deleteExpense = async (expenseId: string) => {
    if (!family?.id) return;
    setDeleting(expenseId);
    try {
      const expenseRef = doc(db, "families", family.id, "expenses", expenseId);
      await deleteDoc(expenseRef);
      toast({ title: "Success", description: "Expense deleted successfully." });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "Could not delete expense." });
    } finally {
        setDeleting(null);
    }
  };

  const loading = expensesLoading || categoriesLoading || membersLoading;

  const goToPreviousMonth = () => {
    setDisplayDate(prevDate => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setDisplayDate(prevDate => addMonths(prevDate, 1));
  };
  
  const isNextMonthButtonDisabled = () => {
    const today = new Date();
    return displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear();
  }

  if (loading) {
    return <div className="flex justify-center mt-8"><Loader /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Expenses for {format(displayDate, 'MMMM yyyy')}</CardTitle>
                <CardDescription>Here are the expenses for the selected month.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={isNextMonthButtonDisabled()}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredExpenses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No expenses this month. Add one above to get started!</p>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map((item: Expense, index: number) => (
              <div key={item.id}>
                <div className="flex items-center gap-4 p-2 rounded-md">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{item.name}</p>
                      <p className="font-semibold text-lg">{currencySymbol}{item.amount.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span>{categoriesMap[item.categoryId] || 'Uncategorized'}</span>
                            {item.isPrivate && <Lock className="h-3 w-3" />}        

                        </div>
                       <span>{item.date ? format(item.date.toDate(), "MMM d, yyyy") : 'No date'}</span>
                    </div>
                  </div>
                  {item.addedBy === user?.uid && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" disabled={deleting === item.id}>
                           {deleting === item.id ? <Loader className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this expense.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteExpense(item.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                {index < filteredExpenses.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
