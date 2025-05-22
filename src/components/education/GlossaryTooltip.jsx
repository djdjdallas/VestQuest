// src/components/education/GlossaryTooltip.jsx

import { useState, useContext, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip";
import { useEducationLevel } from "@/context/EducationContext";
import { Badge } from "@/components/ui/badge";

// Cache for glossary terms to prevent repeated lookups
const glossaryCache = new Map();

export function GlossaryTooltip({ 
  term, 
  children = null,
  showAllContent = false,
  className = "",
  onTermViewed = () => {}
}) {
  const [termData, setTermData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { markConceptViewed } = useEducationLevel();
  
  // CSS class for highlighting text
  const tooltipClass = className || "text-primary underline decoration-dotted cursor-help";
  
  useEffect(() => {
    // Check if we've already fetched and cached this term
    if (glossaryCache.has(term.toLowerCase())) {
      setTermData(glossaryCache.get(term.toLowerCase()));
      setLoading(false);
      return;
    }
    
    // Otherwise, fetch from Supabase
    const fetchTermData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // Try exact match first
        let { data, error } = await supabase
          .from('glossary_terms')
          .select('*')
          .ilike('term', term)
          .limit(1);
          
        if (error) throw error;
        
        // If no exact match, try partial match
        if (!data || data.length === 0) {
          const { data: partialData, error: partialError } = await supabase
            .from('glossary_terms')
            .select('*')
            .ilike('term', `%${term}%`)
            .limit(1);
            
          if (partialError) throw partialError;
          data = partialData;
        }
        
        if (data && data.length > 0) {
          // Process term data
          const processed = {
            id: data[0].id,
            term: data[0].term,
            definition: data[0].definition,
            examples: Array.isArray(data[0].examples) ? data[0].examples : [],
            related_terms: Array.isArray(data[0].related_terms) ? data[0].related_terms : [],
            technical_details: data[0].technical_details,
          };
          
          // Add to cache
          glossaryCache.set(term.toLowerCase(), processed);
          
          setTermData(processed);
        } else {
          // If no match found, use the original term with basic definition
          const fallback = {
            id: `fallback-${term.replace(/\s+/g, '-').toLowerCase()}`,
            term: term,
            definition: "No detailed definition available for this term.",
            examples: [],
            related_terms: [],
            technical_details: null,
          };
          
          // Cache the fallback as well
          glossaryCache.set(term.toLowerCase(), fallback);
          
          setTermData(fallback);
        }
      } catch (err) {
        console.error("Error fetching glossary term:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTermData();
  }, [term]);
  
  // Handle viewing of term
  const handleView = () => {
    if (termData && termData.id) {
      markConceptViewed(termData.id);
      onTermViewed(termData.id);
    }
  };
  
  // If we're showing all content directly inline
  if (showAllContent) {
    if (loading) {
      return <span className={tooltipClass}>{children || term}</span>;
    }
    
    if (error || !termData) {
      return <span className={tooltipClass}>{children || term}</span>;
    }
    
    return (
      <div className="border p-4 rounded-lg mt-2 mb-4" onClick={handleView}>
        <div className="font-medium">{termData.term}</div>
        <div className="mt-1 text-muted-foreground">{termData.definition}</div>
        
        {termData.examples && termData.examples.length > 0 && (
          <div className="mt-2">
            <div className="font-medium text-sm">Example:</div>
            <div className="text-sm">{termData.examples[0]}</div>
          </div>
        )}
        
        {termData.related_terms && termData.related_terms.length > 0 && (
          <div className="mt-2">
            <div className="font-medium text-sm">Related terms:</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {termData.related_terms.map((relatedTerm, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {relatedTerm}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Otherwise, render as an enhanced tooltip
  if (loading || error || !termData) {
    return <span className={tooltipClass}>{children || term}</span>;
  }
  
  // Create the additional interactive content for the tooltip
  const interactiveContent = termData.examples && termData.examples.length > 0 ? (
    <div className="mt-1 pt-1 border-t text-xs">
      <span className="font-medium">Example:</span> {termData.examples[0]}
    </div>
  ) : null;
  
  // Determine the learn more URL based on the term ID
  const learnMoreUrl = termData.id && !termData.id.startsWith('fallback-') 
    ? `/dashboard/education?term=${encodeURIComponent(termData.term.toLowerCase())}`
    : null;
  
  return (
    <EnhancedTooltip
      term={termData.term}
      basicDefinition={termData.definition}
      learnMoreUrl={learnMoreUrl}
      interactiveContent={interactiveContent}
      className={tooltipClass}
    >
      <span onClick={handleView}>
        {children || term}
      </span>
    </EnhancedTooltip>
  );
}