// src/components/education/GlossaryItem.jsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ExternalLink, Bookmark, BookMarked } from "lucide-react";
import Link from "next/link";

export function GlossaryItem({
  term,
  definition,
  examples = [],
  relatedTerms = [],
  technicalDetails = null,
  tags = [],
  onClick = () => {},
  onBookmark = null,
  isBookmarked = false,
  learnMoreUrl = null,
}) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    onClick();
    setExpanded(!expanded);
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span className="truncate" onClick={handleClick}>{term}</span>
          <div className="flex items-center space-x-1">
            {onBookmark && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark();
                }}
                className="h-8 w-8 p-0 rounded-full"
              >
                {isBookmarked ? (
                  <BookMarked className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClick}
              className="h-8 w-8 p-0 rounded-full"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
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
              <div className="bg-muted/50 p-4 rounded-md">
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
      
      {expanded && learnMoreUrl && (
        <CardFooter className="pt-0">
          <Button asChild variant="outline" size="sm" className="mt-2 w-full">
            <Link href={learnMoreUrl} className="flex items-center justify-center">
              Learn more <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}