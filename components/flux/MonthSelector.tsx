"use client";

import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
  className?: string;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatShortLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthSelector({ className }: MonthSelectorProps) {
  const { 
    selectedMonth, 
    setSelectedMonth, 
    availableMonths, 
    addMonth,
    removeMonth,
  } = useSettings();
  
  const [addMonthOpen, setAddMonthOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const currentIndex = availableMonths.indexOf(selectedMonth);
  const canGoOlder = currentIndex < availableMonths.length - 1;
  const canGoNewer = currentIndex > 0;

  const handleGoOlder = () => {
    if (canGoOlder) {
      setSelectedMonth(availableMonths[currentIndex + 1]);
    }
  };

  const handleGoNewer = () => {
    if (canGoNewer) {
      setSelectedMonth(availableMonths[currentIndex - 1]);
    }
  };

  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const isCurrentMonth = selectedMonth === currentMonthKey;

  // Generate months that can be added (last 24 months not already in availableMonths)
  const getAddableMonths = () => {
    const months: string[] = [];
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(date);
      if (!availableMonths.includes(key)) {
        months.push(key);
      }
    }
    return months;
  };

  const addableMonths = getAddableMonths();

  const handleAddMonth = (monthKey: string) => {
    addMonth(monthKey);
    setSelectedMonth(monthKey);
    setAddMonthOpen(false);
  };

  const handleDeleteMonth = () => {
    if (availableMonths.length > 1) {
      // Switch to another month first
      const newIndex = currentIndex === 0 ? 1 : currentIndex - 1;
      const newSelectedMonth = availableMonths[newIndex];
      removeMonth(selectedMonth);
      setSelectedMonth(newSelectedMonth);
    }
    setDeleteConfirmOpen(false);
  };

  const canDelete = availableMonths.length > 1;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isCurrentMonth && (
        <span className="rounded-lg bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          Now
        </span>
      )}

      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger className="h-8 w-[140px] rounded-lg border bg-card px-2 text-xs card-shadow">
          <SelectValue>{formatShortLabel(selectedMonth)}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {availableMonths.map((month) => {
            const isCurrent = month === currentMonthKey;
            return (
              <SelectItem key={month} value={month} className="text-xs">
                <div className="flex items-center gap-2">
                  <span>{formatMonthLabel(month)}</span>
                  {isCurrent && (
                    <span className="text-[10px] text-primary font-medium">NOW</span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div className="flex items-center overflow-hidden rounded-lg border bg-card card-shadow">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-none"
          onClick={handleGoOlder}
          disabled={!canGoOlder}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-none border-l"
          onClick={handleGoNewer}
          disabled={!canGoNewer}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Add Month Button */}
      {addableMonths.length > 0 && (
        <Dialog open={addMonthOpen} onOpenChange={setAddMonthOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 card-shadow"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Add Month Data
              </DialogTitle>
              <DialogDescription>
                Select a month to add and enter its data
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 py-4 max-h-[300px] overflow-y-auto">
              {addableMonths.map((month) => (
                <Button
                  key={month}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddMonth(month)}
                  className="text-xs"
                >
                  {formatShortLabel(month)}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Month Button */}
      {canDelete && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 card-shadow text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {formatMonthLabel(selectedMonth)}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all data for this month. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteMonth}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

