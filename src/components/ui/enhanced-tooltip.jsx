// Create src/components/ui/enhanced-tooltip.jsx

import { useState, useRef, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { InfoIcon, ExternalLinkIcon } from "lucide-react";

export function EnhancedTooltip({
  term,
  basicDefinition,
  children,
  learnMoreUrl = null,
  interactiveContent = null,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 300);
  };

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          className={`text-primary underline decoration-dotted cursor-help ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setOpen(!open)}
        >
          {children || term}
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-xs p-4"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="space-y-2">
            <div className="flex items-start">
              <InfoIcon className="h-4 w-4 text-primary mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">{term}</div>
                <div className="text-xs text-muted-foreground">
                  {basicDefinition}
                </div>
              </div>
            </div>

            {interactiveContent && (
              <div className="pt-2">{interactiveContent}</div>
            )}

            {learnMoreUrl && (
              <div className="pt-1">
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-5 text-xs"
                  asChild
                >
                  <a
                    href={learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    Learn more <ExternalLinkIcon className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
