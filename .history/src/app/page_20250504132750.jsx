import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">VestQuest</h1>
          <p className="mt-4 text-xl text-gray-600">
            Make informed decisions about your startup equity with intelligent scenario modeling
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Simple Calculator</CardTitle>
              <CardDescription>Quick equity calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/calculator">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>Track your equity grants</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button className="w-full">View Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>Learn about equity basics</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/education">
                <Button className="w-full">Learn More</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
