"use client";

import { useMemo, useState } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useCreditCardSpends } from "@/hooks/useFamilyData";
import type { CreditCardSpend } from "@/types";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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

export function CreditCardSpendList() {
  const { user, family } = useAuth();
  const [displayDate, setDisplayDate] = useState(new Date());

  const { startDate, endDate } = useMemo(() => ({
    startDate: startOfMonth(displayDate),
    endDate: endOfMonth(displayDate)
  }), [displayDate]);

  const { data: spends, loading: spendsLoading } = useCreditCardSpends(startDate, endDate);
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);

  const currencySymbol = useMemo(() => family?.currencySymbol || '₹', [family]);

  const filteredSpends = useMemo(() => {
    if (!user) return [];
    return spends;
  }, [spends, user]);

  const totalSpend = useMemo(() => {
    return filteredSpends.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredSpends]);

  const deleteSpend = async (spendId: string) => {
    if (!family?.id) return;
    setDeleting(spendId);
    try {
      const spendRef = doc(db, "families", family.id, "creditCardSpends", spendId);
      await deleteDoc(spendRef);
      toast({ title: "Success", description: "Spend deleted successfully." });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "Could not delete spend." });
    } finally {
        setDeleting(null);
    }
  };

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

  if (spendsLoading) {
    return <div className="flex justify-center mt-8"><Loader /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-accent/10 border-accent/20">
        <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Credit Card Spend for {format(displayDate, 'MMMM yyyy')}</p>
                <h3 className="text-4xl font-bold text-accent">{currencySymbol}{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
              <div>
                  <CardTitle>Recent Spends</CardTitle>
                  <CardDescription>Credit card transactions for {format(displayDate, 'MMMM yyyy')}.</CardDescription>
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
          {filteredSpends.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No credit card spends this month.</p>
          ) : (
            <div className="space-y-2">
              {filteredSpends.map((item: CreditCardSpend, index: number) => (
                <div key={item.id}>
                  <div className="flex items-center gap-4 p-2 rounded-md">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{item.name}</p>
                        <p className="font-semibold text-lg">{currencySymbol}{item.amount.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
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
                              This action cannot be undone. This will permanently delete this credit card spend.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSpend(item.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  {index < filteredSpends.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
