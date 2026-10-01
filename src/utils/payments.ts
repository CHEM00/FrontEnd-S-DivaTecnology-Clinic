// Pagos mixtos por cita: tipos del API y presentación compartida entre la tabla
// "Detalle de Movimientos" y el modal de cobro.

export type PaymentStatus = "no_charge" | "pending" | "partial" | "paid" | "overpaid";

export interface PaymentType {
    id: number;
    name: string;
}

export interface PaymentLine {
    method: string;
    amount: number;
}

export interface PaymentRecord extends PaymentLine {
    id: number;
    idpayment_type: number;
    paid_at: string;
    created_by_name: string | null;
    voided_at: string | null;
    voided_by_name: string | null;
}

// Respuesta de GET/POST /Citas/:id/pagos y de la anulación.
export interface AppointmentPaymentsView {
    idappointment: number;
    total: number;
    paid: number;
    balance: number;
    payment_status: PaymentStatus;
    payments: PaymentRecord[];
}

export const PAYMENT_STATUS_UI: Record<PaymentStatus, { label: string; chip: string; icon: string }> = {
    pending: { label: "Pendiente", chip: "bg-amber-50 text-amber-800 border-amber-200", icon: "fa-clock" },
    partial: { label: "Parcial", chip: "bg-orange-50 text-orange-800 border-orange-200", icon: "fa-circle-half-stroke" },
    paid: { label: "Pagado", chip: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: "fa-circle-check" },
    overpaid: { label: "Excedente", chip: "bg-red-50 text-red-800 border-red-200", icon: "fa-triangle-exclamation" },
    no_charge: { label: "Sin cargo", chip: "bg-gray-50 text-gray-500 border-gray-200", icon: "fa-minus" },
};

// Misma paleta que ya usaba el selector de método. Un método nuevo del catálogo cae en
// el neutro en vez de romper.
const METHOD_DOT: Record<string, string> = {
    Efectivo: "bg-green-500",
    Tarjeta: "bg-blue-500",
    Transferencia: "bg-purple-500",
};
const DEFAULT_METHOD_DOT = "bg-gray-400";

export const methodDotClass = (method: string): string => METHOD_DOT[method] ?? DEFAULT_METHOD_DOT;

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export const formatMoney = (value: number): string => currency.format(value);

// Sumar en centavos: los montos llegan con dos decimales y la suma en float acumularía error.
export const toCents = (value: number | string): number => Math.round(Number(value) * 100);
export const fromCents = (cents: number): number => cents / 100;

export function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Mensaje del API ({ error }) o uno genérico si la respuesta no trae cuerpo JSON.
export async function readApiError(res: Response, fallback: string): Promise<string> {
    try {
        const data = await res.json();
        return typeof data?.error === "string" ? data.error : fallback;
    } catch {
        return fallback;
    }
}

// Eventos entre la tabla y el modal (módulos separados, sin globals compartidos).
export const PAYMENTS_OPEN_EVENT = "pagos:abrir";
export const PAYMENTS_UPDATED_EVENT = "pagos:actualizados";

export interface PaymentsOpenDetail {
    appointmentId: number;
    patientName: string;
    serviceName: string;
}
