
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useExpenseCategories,
  useEarningCategories,
  useShoppingCategories,
} from "@/hooks/useFamilyData";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Plus, Trash2 } from "lucide-react";
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

type CategoryType = "expense" | "earning" | "shopping";

interface CategoryManagerProps {
  title: string;
  categoryType: CategoryType;
}

const useCategories = (categoryType: CategoryType) => {
  const expenseCategories = useExpenseCategories();
  const earningCategories = useEarningCategories();
  const shoppingCategories = useShoppingCategories();

  switch (categoryType) {
    case "expense":
      return { ...expenseCategories, collectionName: "expenseCategories" };
    case "earning":
      return { ...earningCategories, collectionName: "earningCategories" };
    case "shopping":
      return { ...shoppingCategories, collectionName: "shoppingCategories" };
    default:
      throw new Error("Invalid category type");
  }
};

export function CategoryManager({ title, categoryType }: CategoryManagerProps) {
  const { family } = useAuth();
  const { data: categories, loading: categoriesLoading, collectionName } = useCategories(categoryType);
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !newCategoryName.trim()) return;

    setIsAdding(true);
    try {
      const categoriesRef = collection(db, "families", family.id, collectionName);
      const data: any = { name: newCategoryName.trim() };
      if (categoryType === 'expense' && newCategoryBudget) {
          data.budget = parseFloat(newCategoryBudget) || 0;
      }
      await addDoc(categoriesRef, data);
      toast({ title: "Success", description: "Category added." });
      setNewCategoryName("");
      setNewCategoryBudget("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add category." });
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateBudget = async (categoryId: string, budget: string) => {
    if (!family) return;
    setUpdatingId(categoryId);
    try {
      const categoryRef = doc(db, "families", family.id, collectionName, categoryId);
      await updateDoc(categoryRef, { budget: parseFloat(budget) || 0 });
      toast({ title: "Budget updated" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not update budget." });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!family) return;
    setDeletingId(categoryId);
    try {
      const categoryRef = doc(db, "families", family.id, collectionName, categoryId);
      await deleteDoc(categoryRef);
      toast({ title: "Success", description: "Category deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete category." });
    } finally {
      setDeletingId(null);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Add or remove categories for your {categoryType.toLowerCase()}s.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddCategory} className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={`New ${categoryType} category name...`}
              disabled={isAdding}
              className="flex-1"
            />
            {categoryType === 'expense' && (
                <Input
                    type="number"
                    value={newCategoryBudget}
                    onChange={(e) => setNewCategoryBudget(e.target.value)}
                    placeholder="Monthly budget (optional)"
                    className="w-full sm:w-48"
                    disabled={isAdding}
                />
            )}
            <Button type="submit" disabled={isAdding || !newCategoryName.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90 whitespace-nowrap w-full sm:w-auto">
                {isAdding ? <Loader /> : <Plus className="h-4 w-4 mr-2" />}
                Add Category
            </Button>
          </div>
        </form>

        {categoriesLoading ? (
          <div className="flex justify-center py-4"><Loader /></div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center p-2 rounded-md bg-muted/50 gap-2 sm:gap-4">
                <span className="flex-1 font-medium">{cat.name}</span>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  {categoryType === 'expense' && (
                      <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Budget:</span>
                          <Input
                              type="number"
                              defaultValue={cat.budget || 0}
                              onBlur={(e) => {
                                  if (parseFloat(e.target.value) !== (cat.budget || 0)) {
                                      handleUpdateBudget(cat.id, e.target.value);
                                  }
                              }}
                              className="w-24 h-8 text-sm"
                              disabled={updatingId === cat.id}
                          />
                      </div>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" disabled={deletingId === cat.id}>
                        {deletingId === cat.id ? <Loader className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the "{cat.name}" category.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
             {categories.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No categories found.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
