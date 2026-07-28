export function formatearHora(hora?: string | null): string {
    if (hora === null || hora === undefined || hora === "") return "";
    const partes = String(hora).trim().split(":");
    const horas = Number(partes[0]);
    const minutos = Number(partes[1] ?? 0);
    if (Number.isNaN(horas) || Number.isNaN(minutos)) return String(hora);
    const sufijo = horas >= 12 ? "pm" : "am";
    const hora12 = horas % 12 === 0 ? 12 : horas % 12;
    return `${hora12}:${String(minutos).padStart(2, "0")} ${sufijo}`;
}

export function formatearRangoHoras(inicio?: string | null, fin?: string | null): string {
    const formatear = (globalThis as any).formatearHora;
    const desde = formatear(inicio);
    const hasta = formatear(fin);
    if (!desde && !hasta) return "";
    if (!hasta) return desde;
    if (!desde) return hasta;
    return `${desde} - ${hasta}`;
}

export function escribirHoraCampo(campo: HTMLInputElement | HTMLSelectElement | null, hora24?: string | null): void {
    if (!campo) return;
    const valor = hora24 ? String(hora24).slice(0, 5) : "";
    campo.dataset.hora24 = valor;
    campo.value = valor ? (globalThis as any).formatearHora(valor) : "";
}

export function leerHoraCampo(campo: HTMLInputElement | HTMLSelectElement | null): string {
    if (!campo) return "";
    return campo.dataset.hora24 || campo.value || "";
}

(globalThis as any).formatearHora = formatearHora;
