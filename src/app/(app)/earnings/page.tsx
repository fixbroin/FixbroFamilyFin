
import { AddEarningForm } from "@/components/earnings/AddEarningForm";
import { EarningList } from "@/components/earnings/EarningList";
import { TrendingUp } from "lucide-react";

export default function EarningsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold font-headline">Earnings</h1>
        </div>
        <AddEarningForm />
        <EarningList />
      </div>
    </div>
  );
}
