"use client";

import { useState, useEffect } from "react";
import type { ShoppingItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface SetReminderDialogProps {
  item: ShoppingItem | null;
  onClose: () => void;
  onSave: (date: Date) => void;
  onClear: () => void;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

export function SetReminderDialog({ item, onClose, onSave, onClear }: SetReminderDialogProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [hour, setHour] = useState<string>();
  const [minute, setMinute] = useState<string>();

  useEffect(() => {
    if (item) {
      const initialDate = item.reminderAt?.toDate() || new Date();
      setDate(initialDate);
      setHour(initialDate.getHours().toString().padStart(2, '0'));
      // Round down to nearest 5 minutes
      setMinute((Math.floor(initialDate.getMinutes() / 5) * 5).toString().padStart(2, '0'));
    }
  }, [item]);


  if (!item) return null;

  const handleSave = () => {
    if (!date || hour === undefined || minute === undefined) return;
    const finalDate = new Date(date);
    finalDate.setHours(parseInt(hour, 10));
    finalDate.setMinutes(parseInt(minute, 10));
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    
    // If the constructed date is in the past, don't save
    if (finalDate < new Date()) {
      alert("Cannot set a reminder for a past date and time.");
      return;
    }

    onSave(finalDate);
  };
  
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Reminder for "{item.name}"</DialogTitle>
          <DialogDescription>
            {item.reminderAt ? `Current reminder: ${format(item.reminderAt.toDate(), "PPP p")}` : "No reminder set for this item."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
          />
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Time:</p>
            <Select value={hour} onValueChange={setHour}>
              <SelectTrigger><SelectValue placeholder="Hour" /></SelectTrigger>
              <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
            <span className="font-bold">:</span>
             <Select value={minute} onValueChange={setMinute}>
              <SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger>
              <SelectContent>{minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {item.reminderAt ? 
            <Button variant="destructive" onClick={onClear}>Clear Reminder</Button>
            : <div></div>
          }
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Reminder</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
