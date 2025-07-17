"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useShoppingCategories } from "@/hooks/useFamilyData";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { parseTransaction } from "@/ai/flows/parse-transaction-flow";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mic } from "lucide-react";
import { Loader } from "../ui/loader";
import { ListeningIndicator } from "../ui/ListeningIndicator";

const formSchema = z.object({
  name: z.string().min(1, { message: "Item name cannot be empty." }),
  quantity: z.coerce.number().positive().optional(),
  unit: z.string().optional(),
  categoryId: z.string().min(1, { message: "Please select a category." }),
});

const units = ["pcs", "kg", "g", "l", "ml", "pack", "bottle", "can", "dozen"];

const languages = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'हिन्दी' },
  { value: 'kn-IN', label: 'ಕನ್ನಡ' },
  { value: 'ta-IN', label: 'தமிழ்' },
  { value: 'te-IN', label: 'తెలుగు' },
];

export function AddItemForm() {
  const { user, family } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const { data: categories, loading: categoriesLoading } =
    useShoppingCategories();
  
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferredVoiceLanguage') || 'en-IN';
    }
    return 'en-IN';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredVoiceLanguage', language);
    }
  }, [language]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      quantity: undefined,
      unit: "pcs",
      categoryId: "",
    },
  });

  const handleTranscript = async (transcript: string) => {
    if (!transcript) return;
    setIsParsing(true);
    try {
      const categoryNames = categories.map(c => c.name);
      const result = await parseTransaction({ text: transcript, categories: categoryNames });

      let allFieldsSet = true;
      if (result.name) {
        form.setValue("name", result.name);
      } else {
        allFieldsSet = false;
      }

      if (result.amount) {
        form.setValue("quantity", result.amount);
      } else {
        // Quantity is optional for shopping, so don't block submission
      }
      
      if (result.categoryName) {
        const matchedCategory = categories.find(c => c.name.toLowerCase() === result.categoryName?.toLowerCase());
        if (matchedCategory) {
          form.setValue("categoryId", matchedCategory.id);
        } else {
          allFieldsSet = false;
        }
      } else {
        allFieldsSet = false;
      }

      await new Promise(resolve => setTimeout(resolve, 0));
      const isValid = await form.trigger();

      if (isValid && allFieldsSet) {
        await onSubmit(form.getValues());
      } else {
        toast({ title: "Please complete the form", description: "Some details couldn't be filled automatically. Please check and submit." });
      }

    } catch (error) {
      console.error("Failed to parse transaction", error);
      toast({ variant: "destructive", title: "AI Error", description: "Failed to process voice input." });
    } finally {
      setIsParsing(false);
    }
  };

  const { isListening, startListening, stopListening, isSupported } = useVoiceInput({ onTranscript: handleTranscript, language });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !family) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in and in a family to add items.",
      });
      return;
    }

    setLoading(true);
    try {
      const shoppingListRef = collection(
        db,
        "families",
        family.id,
        "shoppingItems"
      );
      await addDoc(shoppingListRef, {
        name: values.name,
        quantity: values.quantity || null,
        unit: values.unit || null,
        categoryId: values.categoryId,
        purchased: false,
        addedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      form.reset({
        name: "",
        quantity: undefined,
        unit: "pcs",
        categoryId: values.categoryId, // Keep category selected
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error adding item",
        description:
          "Could not add item to the shopping list. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <ListeningIndicator isOpen={isListening} onClose={stopListening} />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isSupported && (
          <FormItem>
            <FormLabel>Voice Input Language</FormLabel>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="e.g., Milk, Bread, Eggs..." {...field} />
                </FormControl>
                {isSupported && (
                  <Button type="button" variant="outline" size="icon" onClick={startListening} disabled={isListening || isParsing}>
                      {isListening || isParsing ? <Loader className="h-4 w-4"/> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 1, 2.5"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : e.target.value
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  disabled={categoriesLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          disabled={loading || isParsing}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
        >
          {loading || isParsing ? <Loader /> : <Plus className="h-4 w-4 mr-2" />}
          Add Item
        </Button>
      </form>
    </Form>
  );
}
