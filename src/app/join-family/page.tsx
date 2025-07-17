
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const defaultExpenseCategories = [
  "Groceries", "Utilities", "Rent/Mortgage", "Transportation", "Entertainment", "Healthcare", "Dining Out", "Other"
];
const defaultEarningCategories = [
  "Salary", "Bonus", "Investment", "Freelance", "Other"
];
const defaultShoppingCategories = [
  "Groceries", "Household", "Personal Care", "Electronics", "Clothing", "Other"
];

const createFamilySchema = z.object({
  familyName: z.string().min(3, { message: "Family name must be at least 3 characters." }),
});

const joinFamilySchema = z.object({
  inviteCode: z.string().length(6, { message: "Invite code must be 6 characters." }),
});

export default function JoinFamilyPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If auth isn't loading and the user is already part of a family, redirect them.
    if (!authLoading && userProfile?.familyId) {
      router.replace("/dashboard");
    }
  }, [authLoading, userProfile, router]);


  const createForm = useForm<z.infer<typeof createFamilySchema>>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: { familyName: "" },
  });

  const joinForm = useForm<z.infer<typeof joinFamilySchema>>({
    resolver: zodResolver(joinFamilySchema),
    defaultValues: { inviteCode: "" },
  });

  const handleCreateFamily = async (values: z.infer<typeof createFamilySchema>) => {
    if (!user) return;
    setLoading(true);
    try {
      const inviteCode = generateInviteCode();
      const batch = writeBatch(db);

      const familyRef = doc(collection(db, "families"));
      batch.set(familyRef, {
        name: values.familyName,
        members: [user.uid],
        inviteCode: inviteCode,
        createdAt: serverTimestamp(),
        currency: 'INR',
        currencySymbol: '₹'
      });

      const expenseCatRef = collection(db, "families", familyRef.id, "expenseCategories");
      defaultExpenseCategories.forEach(name => batch.set(doc(expenseCatRef), { name }));

      const earningCatRef = collection(db, "families", familyRef.id, "earningCategories");
      defaultEarningCategories.forEach(name => batch.set(doc(earningCatRef), { name }));
      
      const shoppingCatRef = collection(db, "families", familyRef.id, "shoppingCategories");
      defaultShoppingCategories.forEach(name => batch.set(doc(shoppingCatRef), { name }));

      const userDocRef = doc(db, "users", user.uid);
      batch.update(userDocRef, { familyId: familyRef.id });

      await batch.commit();

      toast({ title: "Family Created!", description: "You can now start collaborating." });
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not create family. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (values: z.infer<typeof joinFamilySchema>) => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "families"), where("inviteCode", "==", values.inviteCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ variant: "destructive", title: "Invalid Code", description: "No family found with that invite code." });
        setLoading(false);
        return;
      }
      
      const familyDoc = querySnapshot.docs[0];
      const batch = writeBatch(db);

      const familyDocRef = doc(db, "families", familyDoc.id);
      batch.update(familyDocRef, {
        members: arrayUnion(user.uid),
      });

      const userDocRef = doc(db, "users", user.uid);
      batch.update(userDocRef, { familyId: familyDoc.id });
      
      await batch.commit();
      
      toast({ title: "Joined Family!", description: `Welcome to the ${familyDoc.data().name} family!` });
      router.push("/dashboard");

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not join family." });
    } finally {
      setLoading(false);
    }
  };

  // Show a loader while checking auth status or if user is being redirected
  if (authLoading || userProfile?.familyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-16 w-16" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">Join a Family</CardTitle>
          <CardDescription>
            Create a new family group or join one with an invite code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="join">Join</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <form onSubmit={createForm.handleSubmit(handleCreateFamily)} className="space-y-4 pt-4">
                <div>
                  <label htmlFor="familyName" className="block text-sm font-medium text-foreground mb-1">Family Name</label>
                  <Input id="familyName" placeholder="e.g., The Smiths" {...createForm.register("familyName")} />
                  {createForm.formState.errors.familyName && <p className="text-sm font-medium text-destructive mt-1">{createForm.formState.errors.familyName.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-accent text-accent-foreground" disabled={loading}>
                  {loading ? <Loader /> : "Create Family"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="join">
              <form onSubmit={joinForm.handleSubmit(handleJoinFamily)} className="space-y-4 pt-4">
                <div>
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-foreground mb-1">Invite Code</label>
                  <Input id="inviteCode" placeholder="ABCXYZ" {...joinForm.register("inviteCode")} />
                  {joinForm.formState.errors.inviteCode && <p className="text-sm font-medium text-destructive mt-1">{joinForm.formState.errors.inviteCode.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-accent text-accent-foreground" disabled={loading}>
                 {loading ? <Loader /> : "Join Family"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
