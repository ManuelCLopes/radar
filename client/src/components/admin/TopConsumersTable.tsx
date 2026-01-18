
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface ConsumerStats {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    totalRequests: number;
    totalCost: number;
}

export function TopConsumersTable({ data }: { data: ConsumerStats[] }) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="col-span-1 md:col-span-2 shadow-sm border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Top API Consumers</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Requests</TableHead>
                            <TableHead className="text-right">Est. Cost Units</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((user) => (
                            <TableRow key={user.userId}>
                                <TableCell>
                                    <div className="font-medium">
                                        {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {user.email}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{user.totalRequests}</TableCell>
                                <TableCell className="text-right font-bold">
                                    {user.totalCost}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
