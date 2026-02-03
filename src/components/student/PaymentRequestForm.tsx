import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, Loader2, CheckCircle, Wallet } from "lucide-react";

const paymentSchema = z.object({
  transaction_id: z.string().min(4, "Transaction ID must be at least 4 characters"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  payment_method: z.string().min(1, "Please select a payment method"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentRequestFormProps {
  onSuccess?: () => void;
}

const PaymentRequestForm = ({ onSuccess }: PaymentRequestFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit = async (data: PaymentFormData) => {
    if (!user) {
      toast.error("Please login to submit payment request");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        transaction_id: data.transaction_id,
        payment_method: data.payment_method,
        amount: parseFloat(data.amount),
        status: "pending",
      });

      if (error) throw error;

      toast.success("Payment request submitted successfully!", {
        description: "Admin will verify your payment soon.",
      });
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error("Failed to submit payment request", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-xl bg-gradient-to-br from-card to-card/80">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Submit Fee Payment</CardTitle>
        <CardDescription>
          Enter your payment details for verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount paid"
              {...register("amount")}
              className="h-11"
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select onValueChange={(value) => setValue("payment_method", value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    UPI
                  </div>
                </SelectItem>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Other
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_method && (
              <p className="text-sm text-destructive">{errors.payment_method.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_id">Transaction ID / Reference</Label>
            <Input
              id="transaction_id"
              placeholder="Enter UPI ref / Bank ref number"
              {...register("transaction_id")}
              className="h-11"
            />
            {errors.transaction_id && (
              <p className="text-sm text-destructive">{errors.transaction_id.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Payment Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentRequestForm;
