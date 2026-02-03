import { useState } from "react";
import PaymentRequestForm from "@/components/student/PaymentRequestForm";
import PaymentHistory from "@/components/student/PaymentHistory";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, History } from "lucide-react";

const StudentPayments = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePaymentSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Fee Payments</h1>
          <p className="text-muted-foreground text-sm">
            Submit and track your fee payments
          </p>
        </div>

        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Submit Payment
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <PaymentRequestForm onSuccess={handlePaymentSuccess} />
          </TabsContent>

          <TabsContent value="history">
            <PaymentHistory key={refreshKey} />
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default StudentPayments;
