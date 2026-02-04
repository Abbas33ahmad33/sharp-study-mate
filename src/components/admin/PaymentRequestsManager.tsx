import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentRequest } from "@/types/payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Loader2, DollarSign, User, Calendar, CreditCard } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PaymentRequestsManager = () => {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

    useEffect(() => {
        fetchPaymentRequests();
    }, []);

    const fetchPaymentRequests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("payment_requests")
                .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            mobile_number
          )
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error("Error fetching payment requests:", error);
            toast.error("Failed to load payment requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, action: 'approved' | 'rejected') => {
        try {
            setActionLoading(requestId);

            // Update payment request status
            const { error: updateError } = await supabase
                .from("payment_requests")
                .update({ status: action })
                .eq("id", requestId);

            if (updateError) throw updateError;

            // Payment approved - status is already updated above
            // Note: Add subscription logic here if subscription_tier column is added to profiles

            toast.success(`Payment request ${action} successfully!`);
            fetchPaymentRequests();
            setSelectedRequest(null);
            setActionType(null);
        } catch (error) {
            console.error(`Error ${action} payment request:`, error);
            toast.error(`Failed to ${action} payment request`);
        } finally {
            setActionLoading(null);
        }
    };

    const openConfirmDialog = (request: PaymentRequest, type: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setActionType(type);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case 'approved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const stats = {
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        total: requests.length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="shadow-card bg-gradient-card border-yellow-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Requests Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Requests</CardTitle>
                    <CardDescription>Manage student fee payment submissions</CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No payment requests yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    {request.profiles?.full_name || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{request.profiles?.email}</div>
                                                    <div className="text-muted-foreground">{request.profiles?.mobile_number || 'N/A'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">
                                                    <CreditCard className="w-3 h-3 mr-1" />
                                                    {request.payment_method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{request.transaction_id}</TableCell>
                                            <TableCell className="font-semibold">PKR {request.amount}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(request.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                                            <TableCell className="text-right">
                                                {request.status === 'pending' ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                                            onClick={() => openConfirmDialog(request, 'approve')}
                                                            disabled={actionLoading === request.id}
                                                        >
                                                            {actionLoading === request.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    Approve
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                                            onClick={() => openConfirmDialog(request, 'reject')}
                                                            disabled={actionLoading === request.id}
                                                        >
                                                            {actionLoading === request.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                    Reject
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No action needed</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
                setSelectedRequest(null);
                setActionType(null);
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionType === 'approve' ? 'Approve Payment Request?' : 'Reject Payment Request?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === 'approve' ? (
                                <>
                                    This will upgrade <strong>{selectedRequest?.profiles?.full_name}</strong> to Premium for 30 days.
                                    <br /><br />
                                    <strong>Transaction ID:</strong> {selectedRequest?.transaction_id}
                                    <br />
                                    <strong>Amount:</strong> PKR {selectedRequest?.amount}
                                </>
                            ) : (
                                <>
                                    Are you sure you want to reject this payment request from <strong>{selectedRequest?.profiles?.full_name}</strong>?
                                    <br /><br />
                                    <strong>Transaction ID:</strong> {selectedRequest?.transaction_id}
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedRequest && handleAction(selectedRequest.id, actionType === 'approve' ? 'approved' : 'rejected')}
                            className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {actionType === 'approve' ? 'Approve' : 'Reject'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PaymentRequestsManager;
