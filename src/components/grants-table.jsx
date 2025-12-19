"use client";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function GrantsTable({ grants = [] }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const handleDeleteGrant = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this grant? This action cannot be undone."
      )
    ) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from("equity_grants")
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast.success("Grant deleted successfully");

        // Refresh the page to update the grants list
        window.location.reload();
      } catch (error) {
        toast.error(error.message || "Failed to delete grant");
      } finally {
        setLoading(false);
      }
    }
  };

  // If no grants, show a message
  if (!grants || grants.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">
          No equity grants found. Add your first grant to get started.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Shares</TableHead>
          <TableHead>Strike Price</TableHead>
          <TableHead>Grant Date</TableHead>
          <TableHead>Vesting Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grants.map((grant) => (
          <TableRow key={grant.id}>
            <TableCell className="font-medium">
              <Link
                href={`/dashboard/grants/${grant.id}`}
                className="hover:underline hover:text-primary"
              >
                {grant.company_name}
              </Link>
            </TableCell>
            <TableCell>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                {grant.grant_type}
              </span>
            </TableCell>
            <TableCell>{grant.shares.toLocaleString()}</TableCell>
            <TableCell>${grant.strike_price.toFixed(2)}</TableCell>
            <TableCell>{formatDate(grant.grant_date)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={grant.vested_percent} className="h-2 w-20" />
                <span className="text-xs text-muted-foreground">
                  {grant.vested_percent?.toFixed(1) || 0}%
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                  <Link href={`/dashboard/grants/${grant.id}`}>
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/grants/${grant.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteGrant(grant.id)}
                      disabled={loading}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
