// Update src/components/education/GlossaryItem.jsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export function GlossaryItem({
  term,
  definition,
  examples = [],
  relatedTerms = [],
  technicalDetails = null,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          {term}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0 rounded-full"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">{definition}</p>

        {expanded && (
          <div className="mt-4 space-y-4">
            {examples.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Examples:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {examples.map((example, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {technicalDetails && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-sm mb-2">Technical Details:</h4>
                <p className="text-sm text-gray-600">{technicalDetails}</p>
              </div>
            )}

            {relatedTerms.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Related Terms:</h4>
                <div className="flex flex-wrap gap-2">
                  {relatedTerms.map((relatedTerm, index) => (
                    <span
                      key={index}
                      className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full cursor-pointer"
                    >
                      {relatedTerm}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
