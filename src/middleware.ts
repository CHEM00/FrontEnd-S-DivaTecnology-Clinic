import { defineMiddleware } from "astro:middleware";
import { jwtVerify } from "jose";

// Clave secreta para verificar el token (DEBE COINCIDIR CON EL BACKEND)
// En producción, usa variables de entorno: import.meta.env.JWT_SECRET
const SECRET_KEY = new TextEncoder().encode("secret_dev_key_change_in_prod");

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect } = context;
    const path = url.pathname;

    // 1. Rutas Públicas (No requieren autenticación)
    const publicRoutes = [
        "/",
        "/LogPaciente",
        "/favicon.ico",
        "/LogoJess.png" // Asegúrate de incluir assets públicos si no son servidos estáticamente antes
    ];

    // Permitir acceso a rutas públicas, API y assets de Astro
    if (
        publicRoutes.includes(path) ||
        path.startsWith("/api/") ||
        path.startsWith("/_image") ||
        path.startsWith("/_astro")
    ) {
        return next();
    }

    // 2. Verificar Token
    const token = cookies.get("auth_token")?.value;

    if (!token) {
        // Si no hay token y la ruta no es pública, redirigir al login
        return redirect("/");
    }

    try {
        // Verificar y decodificar el token
        const { payload } = await jwtVerify(token, SECRET_KEY);

        // Debug: Ver qué hay en el token
        console.log("Middleware Decoded Payload:", payload);

        const userRole = Number(payload.idrol);

        // Rutas de Administrador (Rol 2)
        const adminRoutes = ["/dashboardAdmin", "/configuracion", "/Empleado", "/Agenda", "/HistorialCita", "/Pago", "/Paciente", "/ProductoServicio", "/Roles", "/RolesPermiso"];

        // Rutas de Empleado (Rol 3)
        const empleadoRoutes = ["/dashboardEmpleado", "/Paciente", "/Agenda", "/ProductoServicio"];

        // 1. Validar acceso a rutas exclusivas de Admin
        if (adminRoutes.some(route => path.startsWith(route)) && !empleadoRoutes.some(route => path.startsWith(route))) {
            // Permitir acceso si es Admin (Rol 1 o 2 - Ajustar según tu lógica final)
            // El log indica que tu usuario Admin tiene rol 1.
            if (userRole !== 1 && userRole !== 2) {
                console.log(`Acceso denegado a ruta Admin ${path}. Rol usuario: ${userRole}`);
                return redirect("/");
            }
        }

        // 2. Validar acceso a rutas compartidas o de empleado
        if (empleadoRoutes.some(route => path.startsWith(route))) {
            // Permitir acceso si es Empleado (3) O Admin (1 o 2)
            if (userRole !== 3 && userRole !== 1 && userRole !== 2) {
                console.log(`Acceso denegado a ruta Empleado ${path}. Rol usuario: ${userRole}`);
                return redirect("/");
            }
        }

        // Si pasa todas las verificaciones, continuar
        return next();

    } catch (error) {
        // Token inválido o expirado
        console.error("Token verification failed:", error);
        cookies.delete("auth_token", { path: "/" });
        return redirect("/");
    }
});
