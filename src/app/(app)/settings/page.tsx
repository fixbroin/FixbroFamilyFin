
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, LogOut, Eye, EyeOff, Camera } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { useState, useRef, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, getMonth, getYear, startOfMonth, endOfMonth } from "date-fns";
import type { Expense, Earning } from "@/types";
import { useExpenses, useEarnings, useExpenseCategories, useEarningCategories } from "@/hooks/useFamilyData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";


const nameFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Please enter your current password." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
});

const familyNameFormSchema = z.object({
  name: z.string().min(2, { message: "Family name must be at least 2 characters." }),
});

function ProfileSettings() {
    const { user, userProfile, logout } = useAuth();
    const { toast } = useToast();
    const [nameLoading, setNameLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const nameForm = useForm<z.infer<typeof nameFormSchema>>({
        resolver: zodResolver(nameFormSchema),
        defaultValues: { name: userProfile?.name || "" }
    });

    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: { currentPassword: "", newPassword: "" }
    });

    async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
        if (!user || !event.target.files || !event.target.files[0]) return;

        const file = event.target.files[0];
        if (!file.type.startsWith("image/")) {
            toast({ variant: "destructive", title: "Invalid File Type", description: "Please select an image." });
            return;
        }

        setPhotoLoading(true);
        try {
            const storageRef = ref(storage, `profile-pictures/${user.uid}`);
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);
            
            await updateProfile(user, { photoURL });
            
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { photoURL });
            
            toast({ title: "Success", description: "Profile photo updated." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Upload Failed", description: error.message });
        } finally {
            setPhotoLoading(false);
        }
    }


    async function onNameSubmit(values: z.infer<typeof nameFormSchema>) {
        if (!user) return;
        setNameLoading(true);
        try {
            await updateProfile(user, { displayName: values.name });
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { name: values.name });
            toast({ title: "Success", description: "Your name has been updated." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setNameLoading(false);
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
        if (!user || !user.email) return;
        setPasswordLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, values.newPassword);
            toast({ title: "Success", description: "Your password has been changed successfully." });
            passwordForm.reset();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: "Failed to change password. Please check your current password and try again." });
        } finally {
            setPasswordLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border">
                            <AvatarImage src={userProfile?.photoURL || user?.photoURL || ""} alt={userProfile?.name || ""} />
                            <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            className="hidden"
                            accept="image/*"
                            disabled={photoLoading}
                        />
                         <Button
                            size="icon"
                            variant="outline"
                            className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={photoLoading}
                        >
                            {photoLoading ? <Loader className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                 <div>
                    <p className="text-sm font-medium mb-2">Email</p>
                    <Input readOnly value={userProfile?.email || ""} />
                </div>
                <Separator/>
                <Form {...nameForm}>
                    <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4">
                        <FormField
                            control={nameForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={nameLoading} className="w-full sm:w-auto">
                            {nameLoading ? <Loader/> : "Update Name"}
                        </Button>
                    </form>
                </Form>

                <Separator />

                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showCurrentPassword ? "text" : "password"} {...field} />
                                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
                                                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showNewPassword ? "text" : "password"} {...field} />
                                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
                                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" variant="outline" disabled={passwordLoading} className="w-full sm:w-auto">
                            {passwordLoading ? <Loader/> : "Change Password"}
                        </Button>
                    </form>
                </Form>
                 <Separator />
                 <Button variant="destructive" onClick={logout} className="w-full sm:w-auto">
                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Button>
            </CardContent>
        </Card>
    );
}

function FamilySettings() {
    const { family } = useAuth();
    const { toast } = useToast();
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const familyNameForm = useForm<z.infer<typeof familyNameFormSchema>>({
        resolver: zodResolver(familyNameFormSchema),
        defaultValues: {
            name: family?.name || "",
        },
    });

    useEffect(() => {
        if (family?.name) {
            familyNameForm.reset({ name: family.name });
        }
    }, [family?.name, familyNameForm]);

    const handleFamilyNameSubmit = async (values: z.infer<typeof familyNameFormSchema>) => {
        if (!family) return;
        setIsSubmitting(true);
        try {
            const familyDocRef = doc(db, "families", family.id);
            await updateDoc(familyDocRef, { name: values.name });
            toast({ title: "Success", description: "Family name updated." });
            setIsEditingName(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update family name." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyInviteCode = () => {
        if (!family?.inviteCode) return;
        navigator.clipboard.writeText(family.inviteCode);
        toast({
            title: "Copied!",
            description: "Invite code copied to clipboard.",
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Family Settings</CardTitle>
                <CardDescription>
                    Manage your family name and invite code.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Family Name</Label>
                    {!isEditingName ? (
                        <div className="flex items-center justify-between">
                            <p className="text-lg">{family?.name}</p>
                            <Button variant="outline" size="sm" onClick={() => setIsEditingName(true)}>
                                Edit Name
                            </Button>
                        </div>
                    ) : (
                        <Form {...familyNameForm}>
                            <form onSubmit={familyNameForm.handleSubmit(handleFamilyNameSubmit)} className="space-y-4">
                                <FormField
                                    control={familyNameForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input {...field} disabled={isSubmitting} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsEditingName(false)} disabled={isSubmitting}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader className="h-4 w-4" /> : "Save"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>Your Invite Code</Label>
                     <CardDescription>
                        Share this code with family members to let them join.
                    </CardDescription>
                    <div className="flex items-center gap-2 pt-2">
                        <Input readOnly value={family?.inviteCode || "..."} className="font-mono" />
                        <Button variant="outline" size="icon" onClick={copyInviteCode}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function PrivacySettings() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [loadingField, setLoadingField] = useState<string | null>(null);

    const handleToggle = async (field: 'defaultExpensesToPrivate' | 'defaultEarningsToPrivate', value: boolean) => {
        if (!user) return;
        setLoadingField(field);
        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { [field]: value });
            toast({ title: "Success", description: "Privacy settings updated." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoadingField(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Privacy Controls</CardTitle>
                <CardDescription>Manage default privacy settings for your entries. Changes will apply to new entries you create.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="font-medium">Default Expenses to Private</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically mark new expenses as private.
                        </p>
                    </div>
                    <Switch
                        checked={!!userProfile?.defaultExpensesToPrivate}
                        onCheckedChange={(value) => handleToggle('defaultExpensesToPrivate', value)}
                        disabled={loadingField === 'defaultExpensesToPrivate'}
                        aria-label="Default expenses to private"
                    />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="font-medium">Default Earnings to Private</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically mark new earnings as private.
                        </p>
                    </div>
                    <Switch
                        checked={!!userProfile?.defaultEarningsToPrivate}
                        onCheckedChange={(value) => handleToggle('defaultEarningsToPrivate', value)}
                        disabled={loadingField === 'defaultEarningsToPrivate'}
                        aria-label="Default earnings to private"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function NotificationSettings() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const defaultSound = "/sounds/default-notification.mp3";
    
    const availableSounds = [
        { name: 'Default', path: defaultSound },
        { name: 'Chime', path: 'https://assets.mixkit.co/sfx/preview/mixkit-bright-small-bell-419.mp3' },
        { name: 'Ding', path: 'https://assets.mixkit.co/sfx/preview/mixkit-clear-interface-beep-121.mp3' },
        { name: 'Positive', path: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3' },
        { name: 'Start', path: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3' },
    ];

    const handleSoundChange = async (soundPath: string) => {
        if (!user) return;
        setLoading(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { notificationSound: soundPath });

            const audio = new Audio(soundPath);
            audio.play().catch(e => {
                console.error("Error playing sound preview:", e);
                if (soundPath.startsWith('/')) {
                     toast({ variant: "destructive", title: "Playback Error", description: "Could not play local sound. Make sure the file exists in /public" + soundPath });
                }
            });

            toast({ title: "Success", description: "Notification sound updated." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Customize your app notification settings. For local sounds like 'Default', ensure the file exists at `public/sounds/default-notification.mp3`.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label>Notification Sound</Label>
                     <Select
                        value={userProfile?.notificationSound || defaultSound}
                        onValueChange={handleSoundChange}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a sound" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableSounds.map((sound) => (
                                <SelectItem key={sound.path} value={sound.path}>
                                    {sound.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Select a sound for in-app notifications. The sound will play on selection as a preview.</p>
                </div>
            </CardContent>
        </Card>
    );
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: format(new Date(0, i), "MMMM"),
}));

const generatePdf = (title: string, head: any, body: any, filename: string) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99] }, // gray-500
    });
    doc.save(filename);
};

function ReportSettings() {
    const { data: expenses, loading: expensesLoading } = useExpenses();
    const { data: earnings, loading: earningsLoading } = useEarnings();
    const { data: expenseCategories, loading: expenseCatLoading } = useExpenseCategories();
    const { data: earningCategories, loading: earningCatLoading } = useEarningCategories();
    
    const [expenseMonth, setExpenseMonth] = useState<string>(getMonth(new Date()).toString());
    const [expenseYear, setExpenseYear] = useState<string>(getYear(new Date()).toString());
    
    const [earningMonth, setEarningMonth] = useState<string>(getMonth(new Date()).toString());
    const [earningYear, setEarningYear] = useState<string>(getYear(new Date()).toString());
  
    const [combinedMonth, setCombinedMonth] = useState<string>(getMonth(new Date()).toString());
    const [combinedYear, setCombinedYear] = useState<string>(getYear(new Date()).toString());
  
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const expenseCategoriesMap = useMemo(() => {
        return expenseCategories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {} as Record<string, string>);
    }, [expenseCategories]);
    
    const earningCategoriesMap = useMemo(() => {
        return earningCategories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {} as Record<string, string>);
    }, [earningCategories]);

    const handleExportExpenses = () => {
        setIsGenerating("expenses");
        const month = parseInt(expenseMonth);
        const year = parseInt(expenseYear);
        const startDate = startOfMonth(new Date(year, month));
        const endDate = endOfMonth(new Date(year, month));

        const filteredExpenses = expenses.filter(exp => {
            const expDate = exp.date.toDate();
            return expDate >= startDate && expDate <= endDate;
        });

        const reportTitle = `Expense Report for ${format(startDate, "MMMM yyyy")}`;
        const headers = [["Date", "Name", "Category", "Amount (Rs)"]];
        const data = filteredExpenses.map((exp: Expense) => [
            format(exp.date.toDate(), "dd-MM-yyyy"),
            exp.name,
            expenseCategoriesMap[exp.categoryId] || 'Uncategorized',
            exp.amount.toFixed(2),
        ]);

        generatePdf(reportTitle, headers, data, `Expense-Report-${format(startDate, "MM-yyyy")}.pdf`);
        setIsGenerating(null);
    };

    const handleExportEarnings = () => {
        setIsGenerating("earnings");
        const month = parseInt(earningMonth);
        const year = parseInt(earningYear);
        const startDate = startOfMonth(new Date(year, month));
        const endDate = endOfMonth(new Date(year, month));

        const filteredEarnings = earnings.filter(earn => {
            const earnDate = earn.date.toDate();
            return earnDate >= startDate && earnDate <= endDate;
        });

        const reportTitle = `Earning Report for ${format(startDate, "MMMM yyyy")}`;
        const headers = [["Date", "Name", "Category", "Amount (Rs)"]];
        const data = filteredEarnings.map((earn: Earning) => [
            format(earn.date.toDate(), "dd-MM-yyyy"),
            earn.name,
            earningCategoriesMap[earn.categoryId] || 'Uncategorized',
            earn.amount.toFixed(2),
        ]);
        generatePdf(reportTitle, headers, data, `Earning-Report-${format(startDate, "MM-yyyy")}.pdf`);
        setIsGenerating(null);
    };

    const handleExportCombined = () => {
        setIsGenerating("combined");
        const month = parseInt(combinedMonth);
        const year = parseInt(combinedYear);
        const startDate = startOfMonth(new Date(year, month));
        const endDate = endOfMonth(new Date(year, month));

        const filteredExpenses = expenses.filter(exp => {
            const expDate = exp.date.toDate();
            return expDate >= startDate && expDate <= endDate;
        });
        const filteredEarnings = earnings.filter(earn => {
            const earnDate = earn.date.toDate();
            return earnDate >= startDate && earnDate <= endDate;
        });

        const doc = new jsPDF();
        const reportTitle = `Combined Report for ${format(startDate, "MMMM yyyy")}`;
        doc.text(reportTitle, 14, 15);

        doc.text("Earnings", 14, 25);
        autoTable(doc, {
            startY: 30,
            head: [["Date", "Name", "Category", "Amount (Rs)"]],
            body: filteredEarnings.map((earn: Earning) => [
                format(earn.date.toDate(), "dd-MM-yyyy"),
                earn.name,
                earningCategoriesMap[earn.categoryId] || 'Uncategorized',
                `+ ${earn.amount.toFixed(2)}`,
            ]),
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
        });

        const totalEarnings = filteredEarnings.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
        const netSavings = totalEarnings - totalExpenses;

        const finalY = (doc as any).lastAutoTable.finalY || 10;
        doc.text("Expenses", 14, finalY + 10);
        autoTable(doc, {
            startY: finalY + 15,
            head: [["Date", "Name", "Category", "Amount (Rs)"]],
            body: filteredExpenses.map((exp: Expense) => [
                format(exp.date.toDate(), "dd-MM-yyyy"),
                exp.name,
                expenseCategoriesMap[exp.categoryId] || 'Uncategorized',
                `- ${exp.amount.toFixed(2)}`,
            ]),
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] },
        });

        const finalY2 = (doc as any).lastAutoTable.finalY || 10;
        doc.text(`Total Earnings: Rs ${totalEarnings.toFixed(2)}`, 14, finalY2 + 10);
        doc.text(`Total Expenses: Rs ${totalExpenses.toFixed(2)}`, 14, finalY2 + 20);
        doc.setFont('helvetica', 'bold');
        doc.text(`Net Savings: Rs ${netSavings.toFixed(2)}`, 14, finalY2 + 30);


        doc.save(`Combined-Report-${format(startDate, "MM-yyyy")}.pdf`);
        setIsGenerating(null);
    };

    const loading = expensesLoading || earningsLoading || expenseCatLoading || earningCatLoading;
    if(loading) {
        return <div className="flex h-full items-center justify-center"><Loader/></div>
    }

    return (
        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Export your financial data as a PDF document.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Monthly Expense Report</h3>
              <div className="flex gap-2 mb-4">
                <Select value={expenseMonth} onValueChange={setExpenseMonth}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={expenseYear} onValueChange={setExpenseYear}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleExportExpenses} disabled={isGenerating === 'expenses'} className="w-full sm:w-auto">
                {isGenerating === 'expenses' ? <Loader/> : "Export Expenses PDF"}
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Monthly Earning Report</h3>
              <div className="flex gap-2 mb-4">
                <Select value={earningMonth} onValueChange={setEarningMonth}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={earningYear} onValueChange={setEarningYear}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleExportEarnings} disabled={isGenerating === 'earnings'} className="w-full sm:w-auto">
                {isGenerating === 'earnings' ? <Loader/> : "Export Earnings PDF"}
              </Button>
            </div>
            
            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Combined Monthly Report</h3>
              <div className="flex gap-2 mb-2">
                 <Select value={combinedMonth} onValueChange={setCombinedMonth}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={combinedYear} onValueChange={setCombinedYear}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
               <div className="mb-4">
                 <Select defaultValue="monthly">
                  <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly" disabled>Weekly (coming soon)</SelectItem>
                    <SelectItem value="yearly" disabled>Yearly (coming soon)</SelectItem>
                  </SelectContent>
                </Select>
               </div>
              <Button onClick={handleExportCombined} disabled={isGenerating === 'combined'} className="w-full sm:w-auto">
               {isGenerating === 'combined' ? <Loader/> : "Export Combined PDF"}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
}

export default function SettingsPage() {
    const { loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader /></div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold font-headline mb-6">Settings</h1>
            <Tabs defaultValue="profile" className="w-full">
                <div className="w-full overflow-x-auto">
                    <TabsList className="mx-auto">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="family">Family</TabsTrigger>
                        <TabsTrigger value="privacy">Privacy</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="categories">Categories</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                    </TabsList>
                </div>

                <div className="max-w-2xl mx-auto mt-6">
                     <TabsContent value="profile">
                        <ProfileSettings />
                    </TabsContent>
                    <TabsContent value="family">
                        <FamilySettings />
                    </TabsContent>
                     <TabsContent value="privacy">
                        <PrivacySettings />
                    </TabsContent>
                     <TabsContent value="notifications">
                        <NotificationSettings />
                    </TabsContent>
                    <TabsContent value="categories">
                        <div className="space-y-6">
                            <CategoryManager title="Expense Categories" categoryType="expense" />
                            <CategoryManager title="Earning Categories" categoryType="earning" />
                            <CategoryManager title="Shopping Categories" categoryType="shopping" />
                        </div>
                    </TabsContent>
                    <TabsContent value="reports">
                        <ReportSettings />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
