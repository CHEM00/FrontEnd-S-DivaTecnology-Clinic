export { };

declare global {
    interface Window {
        abrirModalAgregar: () => void;
        abrirModalAcciones: (id: string, nombre: string) => void;
        cerrarModal: (id: string) => void;
        formatearHora: (hora?: string | null) => string;
        formatearRangoHoras: (inicio?: string | null, fin?: string | null) => string;
        escribirHoraCampo: (campo: HTMLInputElement | HTMLSelectElement | null, hora24?: string | null) => void;
        leerHoraCampo: (campo: HTMLInputElement | HTMLSelectElement | null) => string;
    }

    interface Paciente {
        id: number;
        firstname: string;
        lastname: string;
        idemployed: number;
        Telefono?: string;
    }

    interface Empleado {
        id: number;
        firstname: string;
        lastname: string;
    }

    interface Servicio {
        id: number;
        name: string;
        value: string;
    }

    interface Cita {
        id: number;
        idappointment?: number;
        currentday: string;
        inithour: string;
        endhour: string;
        status:
        | "wait"
        | "confirmed"
        | "canceled"
        | "concluded"
        | "no assisted"
        | string;
        reason: string;
        idpatient: number;
        idemployed: number;
        idservice: number;
        salepackage?: boolean;
        session_number?: number;
        total_sessions?: number;
        patientname?: string;
        patient?: {
            id: number;
            firstname: string;
            lastname: string;
        };
        employed?: {
            id: number;
            firstname: string;
            lastname: string;
        };
        service?: {
            id: number;
            name: string;
        };
        [key: string]: any;
    }
}
