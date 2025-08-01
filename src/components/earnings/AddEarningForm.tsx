"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useEarningCategories } from "@/hooks/useFamilyData";
import { format } from "date-fns";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { parseTransaction } from "@/ai/flows/parse-transaction-flow";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, Mic } from "lucide-react";
import { Loader } from "../ui/loader";
import { cn } from "@/lib/utils";
import { ListeningIndicator } from "../ui/ListeningIndicator";

const formSchema = z.object({
  name: z.string().min(1, { message: "Earning name cannot be empty." }),
  amount: z.coerce.number().min(0.01, { message: "Amount must be greater than 0." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  date: z.date(),
  isPrivate: z.boolean().default(false),
});

const languages = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'हिन्दी' },
  { value: 'kn-IN', label: 'ಕನ್ನಡ' },
  { value: 'ta-IN', label: 'தமிழ்' },
  { value: 'te-IN', label: 'తెలుగు' },
];

export function AddEarningForm() {
  const { user, family, userProfile } = useAuth();
  const { data: categories, loading: categoriesLoading } = useEarningCategories();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileDefaultsSet, setProfileDefaultsSet] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  
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
      amount: undefined,
      categoryId: "",
      date: new Date(),
      isPrivate: false,
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
        form.setValue("amount", result.amount);
      } else {
        allFieldsSet = false;
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

  useEffect(() => {
    if (userProfile && !profileDefaultsSet) {
      form.setValue('isPrivate', !!userProfile.defaultEarningsToPrivate);
      setProfileDefaultsSet(true);
    }
  }, [userProfile, profileDefaultsSet, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !family) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in and in a family." });
      return;
    }

    setLoading(true);
    try {
      const earningsRef = collection(db, "families", family.id, "earnings");
      await addDoc(earningsRef, {
        ...values,
        date: Timestamp.fromDate(values.date),
        addedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Success", description: "Earning added successfully." });
      form.reset({
        ...form.getValues(),
        name: "",
        amount: undefined
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add earning. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <ListeningIndicator isOpen={isListening} onClose={stopListening} />
      <CardHeader>
        <CardTitle>Add New Earning</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Earning Name</FormLabel>
                     <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="e.g., Salary, Side Gig" {...field} />
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
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={categoriesLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
                <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                        Private Earning
                    </FormLabel>
                    </FormItem>
                )}
                />

                <Button type="submit" disabled={loading || isParsing} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {loading || isParsing ? <Loader /> : <Plus className="h-4 w-4" />}
                Add Earning
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
