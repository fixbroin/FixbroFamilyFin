
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot, orderBy, Query, OrderByDirection, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import type { Category, Expense, Earning, ShoppingItem, UserProfile, CreditCardSpend } from "@/types";

function useCollection<T extends {id: string; date?: any; createdAt?: any}>(
  collectionName: string, 
  orderByField: string | null = "createdAt", 
  orderByDirection: OrderByDirection = "desc"
) {
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
    const collectionRef = collection(db, "families", family.id, collectionName);
    
    // We fetch the entire collection to maximize local cache usage.
    // Firestore's persistent cache will ensure we only read deltas from the server.
    const q = query(collectionRef);
    
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      
      // Sort locally since we removed server-side ordering to keep the query simple and cache-friendly
      const sortedItems = [...items].sort((a, b) => {
          const valA = a[orderByField as keyof T] || 0;
          const valB = b[orderByField as keyof T] || 0;
          
          // Handle Firestore Timestamps
          const getTime = (v: any) => v?.toDate ? v.toDate().getTime() : (v instanceof Date ? v.getTime() : v);
          const timeA = getTime(valA);
          const timeB = getTime(valB);

          return orderByDirection === "desc" ? timeB - timeA : timeA - timeB;
      });

      setData(sortedItems);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [family?.id, collectionName, orderByField, orderByDirection]);

  return { data, loading };
}

export function useExpenses(startDate?: Date, endDate?: Date) {
  const { data, loading } = useCollection<Expense>("expenses", "date", "desc");
  
  const filteredData = useMemo(() => {
      if (!startDate && !endDate) return data;
      return data.filter(item => {
          const itemDate = item.date?.toDate ? item.date.toDate() : item.date;
          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
      });
  }, [data, startDate, endDate]);

  return { data: filteredData, loading };
}

export function useEarnings(startDate?: Date, endDate?: Date) {
  const { data, loading } = useCollection<Earning>("earnings", "date", "desc");
  
  const filteredData = useMemo(() => {
      if (!startDate && !endDate) return data;
      return data.filter(item => {
          const itemDate = item.date?.toDate ? item.date.toDate() : item.date;
          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
      });
  }, [data, startDate, endDate]);

  return { data: filteredData, loading };
}

export function useShoppingItems() {
  return useCollection<ShoppingItem>("shoppingItems", "createdAt", "desc");
}

export function useCreditCardSpends(startDate?: Date, endDate?: Date) {
  const { data, loading } = useCollection<CreditCardSpend>("creditCardSpends", "date", "desc");
  
  const filteredData = useMemo(() => {
      if (!startDate && !endDate) return data;
      return data.filter(item => {
          const itemDate = item.date?.toDate ? item.date.toDate() : item.date;
          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
      });
  }, [data, startDate, endDate]);

  return { data: filteredData, loading };
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
