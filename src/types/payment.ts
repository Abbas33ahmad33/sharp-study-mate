export interface PaymentRequest {
    id: string;
    user_id: string;
    transaction_id: string;
    payment_method: string;
    amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string | null;
        email: string;
        mobile_number: string | null;
    };
}
