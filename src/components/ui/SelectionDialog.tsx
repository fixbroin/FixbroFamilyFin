"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string | React.ReactNode;
  icon?: React.ReactNode;
}

interface SelectionDialogProps {
  title: string;
  description?: string;
  options: Option[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  triggerLabel?: string | React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectionDialog({
  title,
  description,
  options,
  selectedValue,
  onSelect,
  triggerLabel,
  placeholder = "Select an option...",
  className,
  disabled
}: SelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => o.value === selectedValue);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-10", className)}
        >
          <span className="truncate">
            {selectedOption ? (triggerLabel || selectedOption.label) : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-4">
          <div className="grid gap-1">
            {options.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                className={cn(
                  "w-full justify-start font-normal h-11 px-3 rounded-lg",
                  selectedValue === option.value && "bg-accent/10 text-accent font-medium hover:bg-accent/20"
                )}
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
              >
                <div className="flex items-center justify-between w-full text-left">
                  <div className="flex items-center gap-3">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                  {selectedValue === option.value && <Check className="h-4 w-4 flex-shrink-0" />}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
