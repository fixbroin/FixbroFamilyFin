
"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, Query, OrderByDirection, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import type { Category, Expense, Earning, ShoppingItem, UserProfile } from "@/types";

function useCollection<T extends {id: string}>(collectionName: string, orderByField: string | null = "createdAt", orderByDirection: OrderByDirection = "desc") {
  const { family } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family?.id) {
        setData([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);
    let q: Query;
    const collectionRef = collection(db, "families", family.id, collectionName);

    if (orderByField) {
      q = query(collectionRef, orderBy(orderByField, orderByDirection));
    } else {
      q = query(collectionRef);
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [family?.id, collectionName, orderByField, orderByDirection]);

  return { data, loading };
}

export function useExpenses() {
  return useCollection<Expense>("expenses");
}

export function useEarnings() {
  return useCollection<Earning>("earnings");
}

export function useShoppingItems() {
  return useCollection<ShoppingItem>("shoppingItems");
}

export function useFamilyMembers() {
  const { family } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family?.id) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("familyId", "==", family.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setMembers(memberData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching family members:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [family?.id]);

  return { data: members, loading };
}

export function useExpenseCategories() {
  return useCollection<Category>("expenseCategories", "name", "asc");
}

export function useEarningCategories() {
  return useCollection<Category>("earningCategories", "name", "asc");
}

export function useShoppingCategories() {
  return useCollection<Category>("shoppingCategories", "name", "asc");
}
