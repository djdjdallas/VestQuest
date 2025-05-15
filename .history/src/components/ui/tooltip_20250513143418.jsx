"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

// Create a single provider that can be used app-wide
const TooltipProvider = React.forwardRef(function TooltipProviderWithRef(
  { delayDuration = 0, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Provider
      ref={ref}
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
});

// Fix the Tooltip component
const Tooltip = React.forwardRef(function TooltipWithRef({ ...props }, ref) {
  return <TooltipPrimitive.Root ref={ref} data-slot="tooltip" {...props} />;
});

// Fix the TooltipTrigger component
const TooltipTrigger = React.forwardRef(function TooltipTriggerWithRef(
  { ...props },
  ref
) {
  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      data-slot="tooltip-trigger"
      {...props}
    />
  );
});

// Fix the TooltipContent component
const TooltipContent = React.forwardRef(function TooltipContentWithRef(
  { className, sideOffset = 0, children, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
