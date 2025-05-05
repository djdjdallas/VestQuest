import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  ChevronRight,
  Facebook,
  Github,
  Instagram,
  LineChart,
  Linkedin,
  Twitter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VestQuest</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/calculator"
              className="text-sm font-medium hover:text-primary"
            >
              Calculator
            </Link>
            <Link
              href="/scenario"
              className="text-sm font-medium hover:text-primary"
            >
              Scenarios
            </Link>
            <Link
              href="/education"
              className="text-sm font-medium hover:text-primary"
            >
              Education
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Sign Up</Link>
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-blue-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Make informed decisions about your startup equity
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Intelligent scenario modeling for startup employees.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                    asChild
                  >
                    <Link href="/calculator">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/education">Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-blue-100 to-teal-50 rounded-xl overflow-hidden shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BarChart3 className="h-32 w-32 text-primary/40" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/80 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Features designed for you
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to understand and optimize your startup
                  equity compensation.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Simple Calculator</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <CardDescription className="min-h-[80px]">
                    Easily calculate the potential value of your equity grants
                    under different scenarios. Input your grant details and see
                    projections in seconds.
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/calculator">
                      Try Calculator
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <CardDescription className="min-h-[80px]">
                    Track all your equity grants in one place. Visualize vesting
                    schedules, potential values, and tax implications with our
                    intuitive dashboard.
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard">
                      View Dashboard
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Education</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <CardDescription className="min-h-[80px]">
                    Learn everything you need to know about startup equity. Our
                    comprehensive guides explain complex topics in simple,
                    actionable terms.
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/education">
                      Start Learning
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Calculator Visualization */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Visualize your equity's potential
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Our interactive tools help you understand how your equity
                    could grow over time under different scenarios.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button className="bg-primary hover:bg-primary/90" asChild>
                    <Link href="/calculator">Try the Calculator</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full h-[300px] bg-white rounded-xl overflow-hidden shadow-lg p-6">
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="w-full h-full">
                      <div className="w-full h-full flex items-end justify-between gap-2">
                        <div className="w-1/6 h-[30%] bg-blue-200 rounded-t-md"></div>
                        <div className="w-1/6 h-[45%] bg-blue-300 rounded-t-md"></div>
                        <div className="w-1/6 h-[60%] bg-blue-400 rounded-t-md"></div>
                        <div className="w-1/6 h-[75%] bg-blue-500 rounded-t-md"></div>
                        <div className="w-1/6 h-[90%] bg-blue-600 rounded-t-md"></div>
                        <div className="w-1/6 h-[100%] bg-blue-700 rounded-t-md"></div>
                      </div>
                      <div className="w-full h-[1px] bg-gray-300 mt-2"></div>
                      <div className="w-full flex justify-between mt-2 text-xs text-gray-500">
                        <span>Year 1</span>
                        <span>Year 2</span>
                        <span>Year 3</span>
                        <span>Year 4</span>
                        <span>Year 5</span>
                        <span>Year 6</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Trusted by startup employees
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear from people who have made better decisions about their
                  equity with VestQuest.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <Card className="relative overflow-hidden border-blue-100">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-2 h-12 w-12 flex items-center justify-center">
                      <span className="font-semibold text-primary">JD</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Jamie Dimon</CardTitle>
                      <CardDescription>
                        Senior Engineer at TechStartup
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">
                    "VestQuest helped me understand the true value of my equity
                    package when I was negotiating my job offer. I was able to
                    make an informed decision and negotiate better terms."
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-blue-100">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-2 h-12 w-12 flex items-center justify-center">
                      <span className="font-semibold text-primary">SJ</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Sarah Johnson</CardTitle>
                      <CardDescription>
                        Product Manager at GrowthCo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">
                    "The scenario modeling feature is incredible. I was able to
                    see how different exit valuations would affect my take-home
                    amount after taxes. This tool is essential for anyone with
                    startup equity."
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-blue-100 lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-2 h-12 w-12 flex items-center justify-center">
                      <span className="font-semibold text-primary">MZ</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Michael Zhang</CardTitle>
                      <CardDescription>CFO at LaunchpadX</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">
                    "As a finance professional, I appreciate the depth and
                    accuracy of VestQuest's calculations. The educational
                    resources are top-notch, and the dashboard makes it easy to
                    track multiple grants across different companies. I
                    recommend this to everyone on my team."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to understand your equity?
                </h2>
                <p className="max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join thousands of startup employees making smarter decisions
                  about their compensation.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/calculator">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t bg-background py-6 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">VestQuest</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Making equity compensation transparent and understandable for
                everyone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Product</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/calculator"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Calculator
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/scenario"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Scenarios
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Resources</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link
                      href="/education"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Education
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Company</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row items-center justify-between mt-8 pt-8 border-t">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} VestQuest. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <Linkedin className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <Instagram className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
