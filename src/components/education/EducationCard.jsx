"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function EducationCard({ 
  title, 
  content, 
  example, 
  difficulty = 'beginner', 
  estimatedTime, 
  tags = [], 
  isCompleted = false,
  learnMoreUrl = null,
  actions = null,
  onClick = () => {},
}) {
  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          {isCompleted && (
            <Badge variant="outline" className="bg-primary/10 border-primary/20">
              <Award className="h-3 w-3 mr-1" /> Completed
            </Badge>
          )}
        </div>
        
        {estimatedTime && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 mr-1" /> {estimatedTime}
          </div>
        )}
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow" onClick={onClick}>
        <p className="text-gray-700">{content}</p>
        {example && (
          <div className="bg-muted/50 p-3 rounded-md">
            <h4 className="font-semibold text-sm mb-1">Example:</h4>
            <p className="text-sm text-gray-600">{example}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 flex flex-col items-stretch space-y-2">
        {learnMoreUrl && (
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={learnMoreUrl} className="flex items-center justify-center">
              Learn more <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        )}
        
        {actions && (
          <div className="w-full">
            {actions}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}