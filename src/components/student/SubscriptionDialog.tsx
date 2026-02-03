import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, MessageCircle, CheckCircle } from "lucide-react";

interface SubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SubscriptionDialog = ({ open, onOpenChange }: SubscriptionDialogProps) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'bank'>('easypaisa');
    const [transactionId, setTransactionId] = useState("");

    const handleWhatsAppRedirect = () => {
        // Replace with your actual number
        const phoneNumber = "923001234567";
        const message = encodeURIComponent("Salam! I want to upgrade to Premium. Sending payment proof shortly.");
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !transactionId) return;

        try {
            setIsLoading(true);

            // 1. Create Payment Request Record
            const { error } = await supabase.from('payment_requests').insert({
                user_id: user.id,
                payment_method: paymentMethod,
                transaction_id: transactionId,
                amount: 500, // Hardcoded for now, can be dynamic
                status: 'pending'
            });

            if (error) throw error;

            setStep(2); // Show Success Screen
            toast.success("Payment request submitted successfully!");

        } catch (error) {
            console.error("Payment submission error:", error);
            toast.error("Failed to submit payment request. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetDialog = () => {
        setStep(1);
        setTransactionId("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={resetDialog}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                {step === 1 ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Upgrade to Premium
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Unlock all chapters, unlimited tests, and analytics for just <span className="font-bold text-primary">PKR 500/month</span>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Payment Method Selection */}
                            <div className="space-y-3">
                                <Label>Payment Method</Label>
                                <RadioGroup defaultValue="easypaisa" onValueChange={(v) => setPaymentMethod(v as any)} className="grid grid-cols-2 gap-4">
                                    <div>
                                        <RadioGroupItem value="easypaisa" id="easypaisa" className="peer sr-only" />
                                        <Label
                                            htmlFor="easypaisa"
                                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                        >
                                            <span className="text-lg font-bold">Easypaisa</span>
                                            <span className="text-xs text-muted-foreground">0300-1234567</span>
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
                                        <Label
                                            htmlFor="bank"
                                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                                        >
                                            <span className="text-lg font-bold">Bank Transfer</span>
                                            <span className="text-xs text-muted-foreground">HBL: 1234...</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* WhatsApp Instructions */}
                            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-xl space-y-3 border border-green-100 dark:border-green-900">
                                <p className="text-sm text-green-800 dark:text-green-300 font-medium leading-relaxed">
                                    1. Send <strong>PKR 500</strong> to the account above.
                                    <br />
                                    2. Take a screenshot of the receipt.
                                    <br />
                                    3. Send the screenshot on WhatsApp.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleWhatsAppRedirect}
                                    className="w-full border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/50"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Send Proof on WhatsApp
                                </Button>
                            </div>

                            {/* Form */}
                            <form id="payment-form" onSubmit={handleSubmit} className="space-y-3">
                                <Label htmlFor="trx-id">Transaction ID (TRX ID)</Label>
                                <Input
                                    id="trx-id"
                                    placeholder="e.g. 8421098421"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </form>

                            {/* Additional Information */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Important Note:</span>
                                    Your fee is refundable as per the refund policy.
                                </p>
                                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                                    <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
                                        <strong>Qarz-e-Hasan:</strong> An interest-free support program is available for students who cannot afford the fee. For both (refund/support), please contact the admin.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={resetDialog}>Cancel</Button>
                            <Button type="submit" form="payment-form" disabled={isLoading || !transactionId} className="bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="py-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold">Request Pending!</h2>
                        <p className="text-muted-foreground max-w-[280px] mx-auto">
                            We have received your transaction ID. Your account will be upgraded within 1-2 hours after verification.
                        </p>
                        <Button onClick={resetDialog} className="w-full mt-6">
                            Got it
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SubscriptionDialog;
