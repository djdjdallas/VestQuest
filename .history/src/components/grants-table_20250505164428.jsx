import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

export function GrantsTable() {
  const grants = [
    {
      id: 1,
      company: "TechCorp Inc.",
      type: "ISO",
      shares: 10000,
      strikePrice: "$4.00",
      grantDate: "Jan 15, 2022",
      vestedShares: 4167,
      vestedPercent: 41.7,
    },
    {
      id: 2,
      company: "TechCorp Inc.",
      type: "RSU",
      shares: 2000,
      strikePrice: "N/A",
      grantDate: "Mar 10, 2023",
      vestedShares: 500,
      vestedPercent: 25,
    },
    {
      id: 3,
      company: "Previous Startup",
      type: "NSO",
      shares: 500,
      strikePrice: "$2.50",
      grantDate: "Jun 5, 2020",
      vestedShares: 500,
      vestedPercent: 100,
    },
  ];

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
            <TableCell className="font-medium">{grant.company}</TableCell>
            <TableCell>{grant.type}</TableCell>
            <TableCell>{grant.shares.toLocaleString()}</TableCell>
            <TableCell>{grant.strikePrice}</TableCell>
            <TableCell>{grant.grantDate}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={grant.vestedPercent} className="h-2 w-20" />
                <span className="text-xs text-muted-foreground">
                  {grant.vestedPercent}%
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
