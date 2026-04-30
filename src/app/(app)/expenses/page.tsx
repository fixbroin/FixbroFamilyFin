import { AddExpenseForm } from "@/components/expenses/AddExpenseForm";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { TrendingDown } from "lucide-react";

export default function ExpensesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-rose-500" />
            <h1 className="text-3xl font-bold font-headline">Expenses</h1>
        </div>
        <AddExpenseForm />
        <ExpenseList />
      </div>
    </div>
  );
}
