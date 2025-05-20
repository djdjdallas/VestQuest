// src/utils/glossary-utils.js

import React from 'react';
import { GlossaryTooltip } from '@/components/education/GlossaryTooltip';

// Set of common prepositions, articles, and other short words to ignore
const IGNORE_WORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'for', 'on', 'by', 'at', 'with', 'and', 'or', 'but', 
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those', 'it', 
  'its', 'they', 'them', 'their', 'our', 'your', 'my', 'his', 'her', 'we', 'i', 'you', 'he', 'she',
  'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might',
  'from', 'up', 'down', 'about', 'into', 'over', 'under', 'after', 'before', 'during', 'until', 'while',
  'if', 'then', 'else', 'when', 'where', 'why', 'how'
]);

/**
 * This function takes text content and a glossary terms set,
 * then wraps matching terms with GlossaryTooltip components.
 *
 * @param {string} text - The text to process
 * @param {Set<string>} glossaryTerms - A set of glossary terms to match against
 * @param {Function} onTermViewed - Callback when a term is viewed
 * @return {Array} Array of text fragments and GlossaryTooltip components
 */
export function processTextWithGlossaryTerms(text, glossaryTerms, onTermViewed = () => {}) {
  if (!text || !glossaryTerms || glossaryTerms.size === 0) {
    return text;
  }

  // Sort glossary terms by length (descending) to match longer terms first
  const sortedTerms = Array.from(glossaryTerms)
    .filter(term => term && term.length > 1 && !IGNORE_WORDS.has(term.toLowerCase()))
    .sort((a, b) => b.length - a.length);

  if (sortedTerms.length === 0) {
    return text;
  }

  // Create regex for matching all terms at once (with word boundaries)
  const termsPattern = sortedTerms
    .map(term => term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')) // Escape special regex chars
    .join('|');
  
  const regex = new RegExp(`\\b(${termsPattern})\\b`, 'gi');

  // Track terms we've already highlighted to prevent duplicates in close proximity
  const highlightedTerms = new Set();
  
  // Process the text and build the result array
  const parts = [];
  let lastIndex = 0;
  let match;

  // Use exec to iterate through all matches
  while ((match = regex.exec(text)) !== null) {
    const matchedTerm = match[0];
    const matchedTermLower = matchedTerm.toLowerCase();
    
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Only highlight the term if we haven't seen it recently
    if (!highlightedTerms.has(matchedTermLower)) {
      // Add the highlighted term
      parts.push(
        <GlossaryTooltip 
          key={`term-${match.index}`} 
          term={matchedTerm}
          onTermViewed={onTermViewed}
        >
          {matchedTerm}
        </GlossaryTooltip>
      );
      
      // Add term to highlighted set
      highlightedTerms.add(matchedTermLower);
      
      // Reset the set after a certain number of terms to allow re-highlighting in long text
      if (highlightedTerms.size > 5) {
        const oldestTerm = Array.from(highlightedTerms)[0];
        highlightedTerms.delete(oldestTerm);
      }
    } else {
      // Just add the plain text if we've already highlighted this term recently
      parts.push(matchedTerm);
    }

    lastIndex = match.index + matchedTerm.length;
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * This function loads all glossary terms from a Supabase database
 * and returns them as a Set for efficient matching.
 *
 * @param {Object} supabase - Supabase client instance
 * @return {Promise<Set<string>>} A set of all glossary terms
 */
export async function loadGlossaryTerms(supabase) {
  try {
    const { data, error } = await supabase
      .from('glossary_terms')
      .select('term');
      
    if (error) throw error;
    
    // Create a set of terms and related terms
    const termSet = new Set();
    
    // Add main terms
    if (data && data.length > 0) {
      data.forEach(item => {
        if (item.term) {
          termSet.add(item.term);
        }
      });
    }
    
    // Load related terms as well for better coverage
    const { data: relatedData, error: relatedError } = await supabase
      .from('glossary_terms')
      .select('related_terms');
      
    if (!relatedError && relatedData && relatedData.length > 0) {
      relatedData.forEach(item => {
        if (item.related_terms && Array.isArray(item.related_terms)) {
          item.related_terms.forEach(term => {
            if (term && term.length > 1) {
              termSet.add(term);
            }
          });
        }
      });
    }
    
    return termSet;
  } catch (err) {
    console.error('Error loading glossary terms:', err);
    return new Set();
  }
}

/**
 * React component that wraps text content and adds glossary tooltips
 */
export function GlossaryProcessedText({ 
  children, 
  glossaryTerms, 
  onTermViewed = () => {},
  className = ""
}) {
  if (!children || !glossaryTerms) {
    return <span className={className}>{children}</span>;
  }
  
  // Only process string children
  if (typeof children !== 'string') {
    return <span className={className}>{children}</span>;
  }
  
  const processedContent = processTextWithGlossaryTerms(
    children, 
    glossaryTerms,
    onTermViewed
  );
  
  return <span className={className}>{processedContent}</span>;
}