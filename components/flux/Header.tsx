"use client";

import { RateEditor } from "./RateEditor";
import { UserMenu } from "./UserMenu";
import { Activity } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Flux</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <UserMenu />
          <RateEditor />
        </div>
      </div>
    </header>
  );
}
