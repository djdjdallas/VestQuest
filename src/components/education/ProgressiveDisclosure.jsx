// src/components/education/ProgressiveDisclosure.jsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { InfoIcon, ChevronDown, ChevronRight, LightbulbIcon, PlusCircleIcon, CheckCircleIcon } from "lucide-react";
import { useEducationLevel } from "@/context/EducationContext";

export function ProgressiveDisclosure({
  term,
  basicDefinition,
  intermediateExplanation,
  advancedDetails,
  examples = [],
  relatedTerms = [],
  learnMoreUrl = null,
  onOpen = () => {},
  onComplete = null,
  isCompleted = false,
}) {
  const { educationLevel } = useEducationLevel();
  const [level, setLevel] = useState(1);
  const [showRelated, setShowRelated] = useState(false);
  
  // Pre-expand content based on user's education level
  useEffect(() => {
    if (educationLevel === 'intermediate' && intermediateExplanation) {
      setLevel(2);
    } else if (educationLevel === 'advanced' && advancedDetails) {
      setLevel(3);
    }
  }, [educationLevel, intermediateExplanation, advancedDetails]);

  const handleOpenChange = (open) => {
    if (open) {
      onOpen();
    }
  };

  return (
    <div className="space-y-2 border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start">
        <InfoIcon className="h-5 w-5 text-primary mr-2 mt-0.5" />
        <div className="space-y-1 flex-1">
          <h3 className="font-medium text-base flex items-center">
            {term}
            {isCompleted && (
              <CheckCircleIcon className="h-4 w-4 text-primary ml-2" />
            )}
          </h3>

          {/* Level 1: Basic Definition */}
          <p className="text-sm">{basicDefinition}</p>

          {/* Level 2: Intermediate Explanation */}
          {level >= 2 && intermediateExplanation && (
            <div className="mt-3 text-sm">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-1 h-4 bg-primary rounded"></div>
                <h4 className="font-medium text-primary">Deeper Explanation</h4>
              </div>
              <p className="text-muted-foreground">{intermediateExplanation}</p>
            </div>
          )}

          {/* Level 3: Advanced Details */}
          {level >= 3 && advancedDetails && (
            <div className="mt-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-1 h-4 bg-primary rounded"></div>
                <h4 className="font-medium text-primary">Advanced Details</h4>
              </div>
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                <p>{advancedDetails}</p>

                {examples.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium flex items-center">
                      <LightbulbIcon className="h-4 w-4 mr-1 text-amber-500" /> 
                      Examples:
                    </h4>
                    <ul className="list-disc pl-5 mt-1">
                      {examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Level navigation buttons */}
      <div className="flex items-center justify-between pl-7">
        <div className="flex items-center space-x-2">
          {level < 3 ? (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setLevel(level + 1);
                onOpen();
              }}
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
                <Collapsible open={showRelated} onOpenChange={setShowRelated}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto flex items-center"
                    >
                      Related terms 
                      {showRelated ? 
                        <ChevronDown className="h-3 w-3 ml-1" /> : 
                        <ChevronRight className="h-3 w-3 ml-1" />
                      }
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
        
        {onComplete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onComplete}
            className="text-xs h-7"
          >
            {isCompleted ? (
              <span className="flex items-center">
                <CheckCircleIcon className="h-3 w-3 mr-1" /> Completed
              </span>
            ) : (
              <span className="flex items-center">
                <PlusCircleIcon className="h-3 w-3 mr-1" /> Mark as complete
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}