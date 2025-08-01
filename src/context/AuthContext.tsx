"use client";

import React, { createContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile, Family } from "@/types";
import { Loader } from "@/components/ui/loader";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  family: Family | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userProfileUnsubscribe: Unsubscribe | undefined;
    let familyUnsubscribe: Unsubscribe | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous listeners to avoid memory leaks
      userProfileUnsubscribe?.();
      familyUnsubscribe?.();

      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        userProfileUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
          familyUnsubscribe?.(); // Clean up family listener if user profile changes

          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);

            if (profile.familyId) {
              const familyDocRef = doc(db, "families", profile.familyId);
              familyUnsubscribe = onSnapshot(familyDocRef, (familyDoc) => {
                if (familyDoc.exists()) {
                  setFamily({ id: familyDoc.id, ...familyDoc.data() } as Family);
                } else {
                  setFamily(null);
                }
                setLoading(false);
              }, () => {
                setLoading(false);
              });
            } else {
              // User has a profile but is not in a family
              setFamily(null);
              setLoading(false);
            }
          } else {
            // User is authenticated but has no profile document yet
            // (e.g., in the middle of signup)
            setUserProfile(null);
            setFamily(null);
            setLoading(false);
          }
        }, () => {
          // Error fetching user profile
          setLoading(false);
        });
      } else {
        // User is not logged in
        setUser(null);
        setUserProfile(null);
        setFamily(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      userProfileUnsubscribe?.();
      familyUnsubscribe?.();
    };
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  const value = { user, userProfile, family, loading, logout };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-16 w-16" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
