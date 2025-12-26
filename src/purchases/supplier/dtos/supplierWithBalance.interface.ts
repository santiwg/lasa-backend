export interface SupplierWithBalance {
    id: number;
    businessName: string;
    phone: string;
    email: string;
    cuit: string | null;
    cuil: string | null;
    balancePayable: number;
}