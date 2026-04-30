"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, Lock } from "lucide-react";
import { Loader } from "../ui/loader";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(1, { message: "Item name cannot be empty." }),
  amount: z.coerce.number().min(0.01, { message: "Amount must be greater than 0." }),
  date: z.date(),
  isPrivate: z.boolean().default(false),
});

export function AddCreditCardSpendForm() {
  const { user, family, userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileDefaultsSet, setProfileDefaultsSet] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: undefined,
      date: new Date(),
      isPrivate: false,
    },
  });

  useEffect(() => {
    if (userProfile && !profileDefaultsSet) {
      form.setValue('isPrivate', !!userProfile.defaultCCSpendsToPrivate);
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
      const spendsRef = collection(db, "families", family.id, "creditCardSpends");
      await addDoc(spendsRef, {
        ...values,
        date: Timestamp.fromDate(values.date),
        addedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Success", description: "Credit card spend added successfully." });
      form.reset({
        name: "",
        amount: undefined,
        date: new Date(),
        isPrivate: !!userProfile?.defaultCCSpendsToPrivate
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add spend. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Credit Card Spend</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spend Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grocery, Amazon" {...field} />
                    </FormControl>
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
                    <FormLabel className="font-normal cursor-pointer flex items-center gap-1">
                        Private Spend {field.value && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </FormLabel>
                    </FormItem>
                )}
                />

                <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {loading ? <Loader /> : <Plus className="h-4 w-4 mr-2" />}
                Add Spend
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
