import { AddItemForm } from "@/components/shopping/AddItemForm";
import { ShoppingList } from "@/components/shopping/ShoppingList";

export default function ShoppingPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-headline mb-6">Shopping List</h1>
        <AddItemForm />
        <ShoppingList />
      </div>
    </div>
  );
}
