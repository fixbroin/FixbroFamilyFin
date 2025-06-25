import { AddExpenseForm } from "@/components/expenses/AddExpenseForm";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export default function ExpensesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-headline">Expenses</h1>
        <AddExpenseForm />
        <ExpenseList />
      </div>
    </div>
  );
}
