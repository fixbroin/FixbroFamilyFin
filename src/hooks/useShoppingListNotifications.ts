"use client";

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import type { ShoppingItem } from '@/types';
import { useShoppingItems, useFamilyMembers } from './useFamilyData';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { doc, updateDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { db, app, getFcmToken, registerServiceWorker } from '@/lib/firebase';
import { getMessaging, onMessage } from 'firebase/messaging';

export function useShoppingListNotifications() {
  const { user, family, userProfile } = useAuth();
  const { data: items, loading } = useShoppingItems();
  const { data: members, loading: membersLoading } = useFamilyMembers();
  const { toast } = useToast();

  const prevItemsRef = useRef<Map<string, ShoppingItem>>(new Map());
  const isInitialLoadRef = useRef(true);
  const reminderTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tokenSavedRef = useRef(false);

  const defaultSound = "/sounds/default-notification.mp3";

  const notificationSoundPath = useMemo(() => {
    return userProfile?.notificationSound || defaultSound;
  }, [userProfile?.notificationSound]);

  const membersMap = useMemo(() => {
    if (membersLoading) return {};
    return members.reduce((acc, member) => {
        acc[member.uid] = member.name || "A family member";
        return acc;
    }, {} as Record<string, string>);
  }, [members, membersLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        registerServiceWorker();

        const initFcm = async () => {
            try {
                const messaging = await getMessaging(app);
                onMessage(messaging, (payload) => {
                    console.log('Foreground message received. ', payload);
                    const { notification } = payload;
                    if (notification) {
                        if (!audioRef.current) {
                           audioRef.current = new Audio(notificationSoundPath);
                        }
                        audioRef.current.play().catch(e => console.error("Error playing sound:", e));
                        if ('vibrate' in navigator) {
                           navigator.vibrate([100, 50, 100]);
                        }
                        toast({ title: notification.title, description: notification.body });
                    }
                });
            } catch (err) {
                console.error('Failed to get messaging object', err);
            }
        }
        initFcm();
    }
  }, [notificationSoundPath, toast]);

  useEffect(() => {
    if (user && userProfile && !tokenSavedRef.current) {
      getFcmToken().then(token => {
        if (token) {
          const userDocRef = doc(db, "users", user.uid);
          if (!userProfile.fcmTokens?.includes(token)) {
              updateDoc(userDocRef, { fcmTokens: arrayUnion(token) });
          }
          tokenSavedRef.current = true;
        }
      });
    }
  }, [user, userProfile]);

  const clearReminder = useCallback(async (itemId: string) => {
      if (!family?.id) return;
      const itemRef = doc(db, "families", family.id, "shoppingItems", itemId);
      try {
        await updateDoc(itemRef, {
          reminderAt: null,
          remindedBy: null,
        });
      } catch(e) {
        console.error("Failed to clear reminder", e)
      }
  }, [family?.id]);

  useEffect(() => {
    if (loading || membersLoading || !user || !family?.id) {
      return;
    }
    
    if (isInitialLoadRef.current) {
        prevItemsRef.current = new Map(items.map(i => [i.id, i]));
        isInitialLoadRef.current = false;
    } else {
        const currentItems = new Map(items.map(i => [i.id, i]));

        const playNotificationSound = () => {
            if (!audioRef.current) {
                audioRef.current = new Audio(notificationSoundPath);
            }
            audioRef.current.play().catch(e => console.error("Error playing sound:", e));
             if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        };

        for (const [id, newItem] of currentItems.entries()) {
            const oldItem = prevItemsRef.current.get(id);
            if (!oldItem && newItem.addedBy !== user?.uid) {
                const memberName = membersMap[newItem.addedBy] || 'Someone';
                toast({
                    title: "New Item Added",
                    description: `${memberName} added "${newItem.name}" to the list.`,
                });
                playNotificationSound();
            } else if (oldItem && newItem.purchased && !oldItem.purchased && newItem.purchasedBy !== user?.uid) {
                 const memberName = membersMap[newItem.purchasedBy!] || 'Someone';
                 toast({
                    title: "Item Purchased",
                    description: `✔ "${newItem.name}" was marked as bought by ${memberName}.`,
                });
                playNotificationSound();
            }
        }
        prevItemsRef.current = currentItems;
    }

    // --- Reminder Logic ---
    const activeTimeouts = reminderTimeoutsRef.current;
    const currentItemIds = new Set(items.map(i => i.id));

    // Clear timeouts for deleted or changed items
    for (const itemId of activeTimeouts.keys()) {
        if (!currentItemIds.has(itemId)) {
            clearTimeout(activeTimeouts.get(itemId));
            activeTimeouts.delete(itemId);
        }
    }

    items.forEach(item => {
      // Clear any existing timeout for this item to handle updates
      if (activeTimeouts.has(item.id)) {
        clearTimeout(activeTimeouts.get(item.id));
        activeTimeouts.delete(item.id);
      }

      // Set new timeout if there's a reminder
      if (item.reminderAt) {
        const reminderTime = item.reminderAt.toDate().getTime();
        const delay = reminderTime - Date.now();

        if (delay > 0) {
          const timeoutId = setTimeout(() => {
            const message = `It's time to buy ${item.name}.`;
            
            const audio = new Audio(notificationSoundPath);
            audio.loop = true;
            audio.play().catch(e => console.error("Error playing sound:", e));
            
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }

            const stopAlarm = () => {
                audio.pause();
                audio.currentTime = 0;
                if ('vibrate' in navigator) {
                    navigator.vibrate(0);
                }
            };
            
            const { dismiss } = toast({
              title: "Shopping Reminder",
              description: message,
              duration: 300000, // 5 minutes
              onOpenChange: (open) => {
                if (!open) {
                    stopAlarm();
                }
              },
            });

            if ('Notification' in window && Notification.permission === 'granted') {
              const browserNotif = new Notification("Shopping Reminder", {
                body: message,
                icon: '/icons/apple-touch-icon.png',
                requireInteraction: true,
                tag: `reminder-${item.id}`
              });
              browserNotif.onclick = () => {
                dismiss();
                window.focus();
              };
               browserNotif.onclose = () => {
                stopAlarm();
              };
            }
            
            clearReminder(item.id);
            activeTimeouts.delete(item.id);

          }, delay);
          activeTimeouts.set(item.id, timeoutId);
        } else if(item.reminderAt) {
            clearReminder(item.id);
        }
      }
    });

  }, [items, loading, user, toast, family, clearReminder, notificationSoundPath, membersMap, membersLoading]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
        const activeTimeouts = reminderTimeoutsRef.current;
        for (const timeoutId of activeTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        activeTimeouts.clear();
    }
  }, []);
}
