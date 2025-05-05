"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GlossaryItem({ term, definition }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{term}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">{definition}</p>
      </CardContent>
    </Card>
  );
}
