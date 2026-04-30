import { AddCreditCardSpendForm } from "@/components/credit-card/AddCreditCardSpendForm";
import { CreditCardSpendList } from "@/components/credit-card/CreditCardSpendList";
import { CreditCard } from "lucide-react";

export default function CreditCardPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold font-headline">Credit Card Spends</h1>
        </div>
        <AddCreditCardSpendForm />
        <CreditCardSpendList />
      </div>
    </div>
  );
}
