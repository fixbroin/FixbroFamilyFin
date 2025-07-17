"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingBag, Users, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if user is logged in and data has loaded
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Fixbro FamilyFin";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://balance.fixbro.in";

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: appName,
    url: appUrl,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    description: 'Shared expense tracker and shopping list for your family.',
    featureList: [
      "Shared Shopping Lists",
      "Expense Tracking",
      "Family Collaboration",
      "Private Expenses & Earnings",
      "Category Management",
      "PDF Reports"
    ],
    screenshot: "https://placehold.co/1280x720.png",
    creator: {
      "@type": "Organization",
      "name": appName
    }
  };

  // Show a loader while checking auth state or if user is being redirected
  if (loading || user) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader className="h-16 w-16" />
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        key="product-jsonld"
      />
      <div className="flex flex-col min-h-screen bg-background">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-primary-foreground">{appName}</h1>
        </header>

        <main className="flex-grow flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-4 font-headline">
              Simplify Your Family's Finances
            </h2>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
              Collaborate on shopping lists and track expenses together. {appName} makes managing money simple and stress-free.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Get Started
              </Button>
            </Link>
          </div>
        </main>

        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/20 rounded-full mb-4">
                  <ShoppingBag className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-headline">Shared Shopping Lists</h3>
                <p className="text-muted-foreground">
                  Create shopping lists that sync in real-time. Never forget an item again.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/20 rounded-full mb-4">
                  <Wallet className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-headline">Expense Tracking</h3>
                <p className="text-muted-foreground">
                  Easily log expenses and see where your money is going as a family.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/20 rounded-full mb-4">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-headline">Family Collaboration</h3>
                <p className="text-muted-foreground">
                  Join your family group with a simple invite code to start collaborating.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center py-6 text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} {appName}. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
