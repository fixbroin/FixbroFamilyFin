
"use client";

import { useMemo, useState } from "react";
import { doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useShoppingItems, useShoppingCategories } from "@/hooks/useFamilyData";
import type { ShoppingItem } from "@/types";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, AlarmClock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { SetReminderDialog } from "./SetReminderDialog";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ShoppingList() {
  const { user, family } = useAuth();
  const { data: items, loading: itemsLoading } = useShoppingItems();
  const { data: categories, loading: categoriesLoading } = useShoppingCategories();
  const [reminderItem, setReminderItem] = useState<ShoppingItem | null>(null);
  const { toast } = useToast();

  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const togglePurchased = async (item: ShoppingItem) => {
    if (!family?.id || !user?.uid) return;
    const itemRef = doc(db, "families", family.id, "shoppingItems", item.id);
    const newPurchasedState = !item.purchased;
    try {
      await updateDoc(itemRef, {
        purchased: newPurchasedState,
        purchasedBy: newPurchasedState ? user.uid : null,
      });
    } catch (error: any) {
      if (error.code === 'not-found') {
        toast({
          variant: "destructive",
          title: "Item unavailable",
          description: "This item may have been deleted by another family member.",
        });
      } else {
         toast({
          variant: "destructive",
          title: "Update failed",
          description: "Could not update the item. Please try again.",
        });
      }
       console.error("Failed to toggle purchase status:", error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!family?.id) return;
    const itemRef = doc(db, "families", family.id, "shoppingItems", itemId);
    await deleteDoc(itemRef);
  };
  
  const handleSetReminder = async (date: Date) => {
    if (!family?.id || !user?.uid || !reminderItem) return;
    const itemRef = doc(db, "families", family.id, "shoppingItems", reminderItem.id);
    try {
      await updateDoc(itemRef, {
        reminderAt: Timestamp.fromDate(date),
        remindedBy: user.uid,
      });
      toast({ title: "Reminder Set!", description: `You'll be reminded to buy ${reminderItem.name}.` });
      setReminderItem(null);
    } catch (error: any) {
      if (error.code === 'not-found') {
        toast({
          variant: "destructive",
          title: "Item unavailable",
          description: "Cannot set reminder for an item that has been deleted.",
        });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not set reminder." });
      }
      setReminderItem(null);
    }
  };

  const handleClearReminder = async () => {
    if (!family?.id || !reminderItem) return;
    const itemRef = doc(db, "families", family.id, "shoppingItems", reminderItem.id);
    try {
      await updateDoc(itemRef, {
        reminderAt: null,
        remindedBy: null,
      });
      toast({ title: "Reminder Cleared", description: `The reminder for ${reminderItem.name} has been removed.` });
      setReminderItem(null);
    } catch (error: any) {
        if (error.code === 'not-found') {
             // The item is already gone, which means the reminder is effectively cleared.
             // We can just log this and close the dialog without bothering the user.
             console.warn(`Attempted to clear reminder for a non-existent item: ${reminderItem?.id}`);
        } else {
            toast({ variant: "destructive", title: "Error", description: "Could not clear reminder." });
        }
        setReminderItem(null);
    }
  }
  
  const { itemsToBuy, purchasedItems } = useMemo(() => {
    const itemsToBuy: ShoppingItem[] = [];
    const purchasedItems: ShoppingItem[] = [];
    items.forEach(item => {
      if (item.purchased) {
        purchasedItems.push(item);
      } else {
        itemsToBuy.push(item);
      }
    });
    return { itemsToBuy, purchasedItems };
  }, [items]);

  const loading = itemsLoading || categoriesLoading;

  if (loading) {
    return <Loader className="mt-8" />;
  }
  
  const renderItem = (item: ShoppingItem) => (
      <div className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50">
        <Checkbox
          id={item.id}
          checked={item.purchased}
          onCheckedChange={() => togglePurchased(item)}
          className="h-5 w-5 mt-1"
        />
        <div className="flex-1 grid gap-1">
          <label
            htmlFor={item.id}
            className={cn(
              "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
              item.purchased && "line-through text-muted-foreground"
            )}
          >
            {item.name}
          </label>
          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            {item.quantity && item.unit && (
              <span>
                {item.quantity} {item.unit}
              </span>
            )}
            {item.categoryId && categoriesMap[item.categoryId] && (
              <>
                {item.quantity && <span className="text-xs">●</span>}
                <span>{categoriesMap[item.categoryId]}</span>
              </>
            )}
            {item.reminderAt && (
                <>
                <span className="text-xs">●</span>
                <span className="flex items-center gap-1 text-accent font-medium">
                  <AlarmClock className="h-3.5 w-3.5"/>
                  {format(item.reminderAt.toDate(), "MMM d, p")}
                </span>
                </>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <Button
              variant="ghost"
              size="icon"
              onClick={() => setReminderItem(item)}
              className={cn("text-muted-foreground hover:text-accent h-8 w-8", item.reminderAt && "text-accent")}
            >
              <AlarmClock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteItem(item.id)}
            className="text-muted-foreground hover:text-destructive h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
  );

  return (
    <>
    <SetReminderDialog
      item={reminderItem}
      onClose={() => setReminderItem(null)}
      onSave={handleSetReminder}
      onClear={handleClearReminder}
    />
    <Card>
      <CardHeader>
        <CardTitle>Our Shopping List</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Your shopping list is empty. Add an item to get started!
          </p>
        ) : (
           <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 px-2">Need to Buy ({itemsToBuy.length})</h3>
                {itemsToBuy.length > 0 ? (
                  <div className="space-y-2">
                    {itemsToBuy.map((item, index) => (
                      <div key={item.id}>
                        {renderItem(item)}
                        {index < itemsToBuy.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm px-2 py-4 text-center">All caught up!</p>
                )}
              </div>
              
              {purchasedItems.length > 0 && (
                <Accordion type="single" collapsible className="w-full border-t pt-4">
                  <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline px-2 py-0">
                      Already Bought ({purchasedItems.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {purchasedItems.map((item, index) => (
                           <div key={item.id}>
                             {renderItem(item)}
                             {index < purchasedItems.length - 1 && <Separator />}
                           </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
