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
      <DialogContent className="w-[calc(100%-4px)] max-w-none sm:max-w-[425px] p-0 gap-0 overflow-hidden rounded-xl sm:rounded-lg">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-4" type="always">
          <div className="grid gap-1">
            {options.map((option) => (
  <Button
    key={option.value}
    variant="ghost"
    className={cn(
  "w-full justify-start h-11 px-4 rounded-xl border transition-all duration-150 text-left",
  
  selectedValue === option.value
    ? "bg-blue-600 text-white border-blue-600"
    : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"
)}
    onClick={() => {
      onSelect(option.value);
      setOpen(false);
    }}
  >
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        {option.icon}
        <span>{option.label}</span>
      </div>
      {selectedValue === option.value && (
        <Check className="h-4 w-4 flex-shrink-0" />
      )}
    </div>
  </Button>
))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
