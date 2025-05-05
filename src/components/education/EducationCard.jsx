"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function EducationCard({ title, content, example }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">{content}</p>
        {example && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold mb-2">Example:</h4>
            <p className="text-sm text-gray-600">{example}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
