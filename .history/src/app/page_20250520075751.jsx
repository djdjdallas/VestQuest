"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Dynamic headline rotation
  const [rotatingWordIndex, setRotatingWordIndex] = useState(0);
  const rotatingWords = [
    "journey",
    "decisions",
    "future",
    "potential",
    "strategy",
  ];

  // Set up the rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingWordIndex(
        (prevIndex) => (prevIndex + 1) % rotatingWords.length
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Vestup</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/calculator"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Calculator
            </Link>
            <Link
              href="/scenario"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Scenarios
            </Link>
            <Link
              href="/education"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Education
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-4 space-y-4 border-t">
            <Link
              href="/dashboard"
              className="block py-2 text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/calculator"
              className="block py-2 text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Calculator
            </Link>
            <Link
              href="/education"
              className="block py-2 text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Education
            </Link>
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="w-full">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-blue-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
                    Make better equity decisions
                  </span>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Take control of your equity{" "}
                    <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-md font-bold animate-fade-in-out">
                      {rotatingWords[rotatingWordIndex]}
                    </span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    From vesting schedules to exit scenarios, Vestup gives you
                    the tools to maximize your compensation and confidently
                    navigate every equity milestone.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 transition-colors"
                    asChild
                  >
                    <Link href="/calculator">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="transition-colors"
                    asChild
                  >
                    <Link href="/education">Learn More</Link>
                  </Button>
                </div>

                {/* Social proof */}
                <div className="pt-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Trusted by employees at
                  </p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                      Stripe
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                      Figma
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                      Notion
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                      Airbnb
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-blue-100 to-teal-50 rounded-xl overflow-hidden shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[90%] h-[80%] bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium">Equity Scenario</span>
                        <div className="flex items-center text-xs text-primary">
                          <span>Live Demo</span>
                          <div className="w-2 h-2 rounded-full bg-green-500 ml-2 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded-full w-full"></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-20 bg-blue-100 rounded-lg"></div>
                          <div className="h-20 bg-green-100 rounded-lg"></div>
                        </div>
                        <div className="h-40 bg-gray-100 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-[800px]">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Features
                </span>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything you need to optimize your equity
                </h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Vestup helps startup employees understand, track, and optimize
                  their equity compensation.
                </p>
              </div>
            </div>

            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              {featureCards.map((feature, index) => (
                <Card
                  key={index}
                  className="relative overflow-hidden transition-all hover:shadow-md"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <CardDescription className="min-h-[80px]">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full transition-colors"
                      asChild
                    >
                      <Link href={feature.link}>
                        {feature.buttonText}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section - New addition */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-[800px]">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  How It Works
                </span>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Three simple steps to equity clarity
                </h2>
                <p className="text-muted-foreground">
                  Understanding your equity doesn't have to be complicated
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-xl font-bold mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-medium mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculator Visualization */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    Interactive Tools
                  </span>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Visualize your equity's potential
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Our interactive tools help you understand how your equity
                    could grow over time under different scenarios.
                  </p>
                  <ul className="space-y-2 mt-4">
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span>Model multiple exit scenarios</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span>Calculate tax implications</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span>Compare different vesting schedules</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                  <Button
                    className="bg-primary hover:bg-primary/90 transition-colors"
                    asChild
                  >
                    <Link href="/calculator">Try the Calculator</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full h-[350px] bg-white rounded-xl overflow-hidden shadow-lg p-6">
                  {/* Enhanced visualization */}
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="w-full h-full">
                      <div className="mb-4 flex justify-between items-center">
                        <div className="text-sm font-medium">
                          Exit Value Comparison
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        </div>
                      </div>
                      <div className="w-full h-[250px] flex items-end justify-between gap-2">
                        <div className="flex flex-col items-center w-1/3">
                          <div
                            className="w-full bg-blue-500 rounded-t-md"
                            style={{ height: "60%" }}
                          ></div>
                          <div className="mt-2 text-xs">IPO</div>
                          <div className="text-xs text-muted-foreground">
                            $500k
                          </div>
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                          <div
                            className="w-full bg-green-500 rounded-t-md"
                            style={{ height: "75%" }}
                          ></div>
                          <div className="mt-2 text-xs">Acquisition</div>
                          <div className="text-xs text-muted-foreground">
                            $750k
                          </div>
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                          <div
                            className="w-full bg-purple-500 rounded-t-md"
                            style={{ height: "40%" }}
                          ></div>
                          <div className="mt-2 text-xs">Secondary</div>
                          <div className="text-xs text-muted-foreground">
                            $350k
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-[1px] bg-gray-200 mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Testimonials
                </span>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Trusted by startup employees
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear from people who have made better decisions about their
                  equity with Vestup.
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
                    "Vestup helped me understand the true value of my equity
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
                    accuracy of Vestup's calculations. The educational resources
                    are top-notch, and the dashboard makes it easy to track
                    multiple grants across different companies. I recommend this
                    to everyone on my team."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-6">
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
                <Button
                  size="lg"
                  variant="secondary"
                  className="transition-colors"
                  asChild
                >
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
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">Vestup</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Making equity compensation transparent and understandable for
                everyone.
              </p>

              {/* Added newsletter subscription */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">
                  Subscribe to our newsletter
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 rounded-md border border-input px-3 py-2 text-sm"
                  />
                  <Button size="sm">Subscribe</Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Product</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/calculator"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Calculator
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/scenario"
                      className="text-muted-foreground hover:text-foreground transition-colors"
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
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Education
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors"
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
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors"
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
              © {new Date().getFullYear()} Vestup. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component for checkmark in list items
function CheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Feature cards data
const featureCards = [
  {
    icon: <Calculator className="h-6 w-6 text-primary" />,
    title: "Equity Calculator",
    description:
      "Easily calculate the potential value of your equity grants under different scenarios. Input your grant details and see projections in seconds.",
    link: "/calculator",
    buttonText: "Try Calculator",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    title: "Dashboard",
    description:
      "Track all your equity grants in one place. Visualize vesting schedules, potential values, and tax implications with our intuitive dashboard.",
    link: "/dashboard",
    buttonText: "View Dashboard",
  },
  {
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    title: "Education",
    description:
      "Learn everything you need to know about startup equity. Our comprehensive guides explain complex topics in simple, actionable terms.",
    link: "/education",
    buttonText: "Start Learning",
  },
];

// How it works steps
const steps = [
  {
    title: "Input Your Grants",
    description:
      "Add details about your equity grants, including vesting schedule and strike price.",
  },
  {
    title: "Create Scenarios",
    description:
      "Model different exit scenarios to understand potential outcomes.",
  },
  {
    title: "Make Informed Decisions",
    description:
      "Use insights to optimize your equity decisions and maximize value.",
  },
];
