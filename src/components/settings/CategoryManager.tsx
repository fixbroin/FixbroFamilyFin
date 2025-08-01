
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
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !newCategoryName.trim()) return;

    setIsAdding(true);
    try {
      const categoriesRef = collection(db, "families", family.id, collectionName);
      await addDoc(categoriesRef, { name: newCategoryName.trim() });
      toast({ title: "Success", description: "Category added." });
      setNewCategoryName("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add category." });
    } finally {
      setIsAdding(false);
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
        <form onSubmit={handleAddCategory} className="flex items-center gap-2 mb-4">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={`New ${categoryType} category...`}
            disabled={isAdding}
          />
          <Button type="submit" disabled={isAdding || !newCategoryName.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isAdding ? <Loader /> : <Plus className="h-4 w-4 mr-2" />}
            Add
          </Button>
        </form>

        {categoriesLoading ? (
          <div className="flex justify-center py-4"><Loader /></div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span>{cat.name}</span>
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
