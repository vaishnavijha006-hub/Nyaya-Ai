"use client";

import * as React from "react";
import { Check, ChevronsUpDown, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface LegalVersion {
  id: string;
  name: string;
  year: string;
  status: "active" | "repealed" | "draft";
}

interface LegalVersionSelectorProps {
  versions: LegalVersion[];
  currentVersionId: string;
  onVersionSelect: (id: string) => void;
}

export function LegalVersionSelector({ versions, currentVersionId, onVersionSelect }: LegalVersionSelectorProps) {
  const [open, setOpen] = React.useState(false);
  
  const currentVersion = versions.find((v) => v.id === currentVersionId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[300px] justify-between shadow-sm bg-card"
        >
          <div className="flex items-center gap-2 truncate">
            <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {currentVersion ? `${currentVersion.name} (${currentVersion.year})` : "Select version..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search versions..." />
          <CommandList>
            <CommandEmpty>No version found.</CommandEmpty>
            <CommandGroup>
              {versions.map((version) => (
                <CommandItem
                  key={version.id}
                  value={version.id}
                  onSelect={(currentValue) => {
                    onVersionSelect(currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{version.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{version.year}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        version.status === "active" ? "bg-green-100 text-green-700" :
                        version.status === "repealed" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      )}>
                        {version.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      currentVersionId === version.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
