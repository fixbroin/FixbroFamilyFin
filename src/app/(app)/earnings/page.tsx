
import { AddEarningForm } from "@/components/earnings/AddEarningForm";
import { EarningList } from "@/components/earnings/EarningList";

export default function EarningsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-headline">Earnings</h1>
        <AddEarningForm />
        <EarningList />
      </div>
    </div>
  );
}
