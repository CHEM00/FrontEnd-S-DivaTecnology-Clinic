export { };

declare global {
    interface Window {
        abrirModalAgregar: () => void;
        abrirModalAcciones: (id: string, nombre: string) => void;
        cerrarModal: (id: string) => void;
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
        status: 'wait' | 'confirmed' | 'canceled' | 'concluded';
        reason: string;
        patient_firstname?: string;
        patient_lastname?: string;
        service_name?: string;
        price?: string;
    }
}
