// Create src/components/education/ProgressiveDisclosure.jsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { InfoIcon, ChevronDown, ChevronRight } from "lucide-react";

export function ProgressiveDisclosure({
  term,
  basicDefinition,
  intermediateExplanation,
  advancedDetails,
  examples = [],
  relatedTerms = [],
}) {
  const [level, setLevel] = useState(1);

  return (
    <div className="space-y-2">
      <div className="flex items-start">
        <InfoIcon className="h-5 w-5 text-primary mr-2 mt-0.5" />
        <div className="space-y-1 flex-1">
          <h3 className="font-medium text-base">{term}</h3>

          {/* Level 1: Basic Definition */}
          <p className="text-sm">{basicDefinition}</p>

          {/* Level 2: Intermediate Explanation */}
          {level >= 2 && (
            <div className="mt-2 text-sm">
              <p className="text-muted-foreground">{intermediateExplanation}</p>
            </div>
          )}

          {/* Level 3: Advanced Details */}
          {level >= 3 && (
            <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm">
              <p>{advancedDetails}</p>

              {examples.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium">Examples:</h4>
                  <ul className="list-disc pl-5 mt-1">
                    {examples.map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Level navigation buttons */}
      <div className="flex items-center space-x-2 pl-7">
        {level < 3 ? (
          <Button
            variant="link"
            size="sm"
            onClick={() => setLevel(level + 1)}
            className="text-primary p-0 h-auto"
          >
            Learn more <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="link"
              size="sm"
              onClick={() => setLevel(1)}
              className="text-muted-foreground p-0 h-auto"
            >
              Show less
            </Button>

            {relatedTerms.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto flex items-center"
                  >
                    Related terms <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="pl-5 mt-2 space-y-1">
                    {relatedTerms.map((term, index) => (
                      <li
                        key={index}
                        className="text-sm text-primary underline cursor-pointer"
                      >
                        {term}
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
