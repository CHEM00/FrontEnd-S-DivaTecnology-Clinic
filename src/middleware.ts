import { defineMiddleware } from "astro:middleware";
import { jwtVerify } from "jose";

// Debe ser idéntico al JWT_SECRET del backend. process.env cubre el runtime en
// producción; import.meta.env cubre `astro dev` (carga el .env local).
const JWT_SECRET = process.env.JWT_SECRET ?? import.meta.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error(
        "JWT_SECRET no está definido",
    );
}
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

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
        const { payload } = await jwtVerify(token, SECRET_KEY);
        const userRole = Number(payload.idrol);

        // Identidad verificada para las páginas: a diferencia de una cookie
        // escrita por el cliente, este rol no se puede falsificar.
        context.locals.user = {
            id: Number(payload.id),
            email: String(payload.email ?? ""),
            idrol: userRole,
            firstname: String(payload.firstname ?? ""),
            lastname: String(payload.lastname ?? ""),
        };

        // Rutas de Administrador (Rol 2)
        const adminRoutes = ["/dashboardAdmin", "/configuracion", "/Empleado", "/Agenda", "/HistorialCita", "/Pago", "/Paciente", "/ProductoServicio", "/Roles", "/RolesPermiso"];

        // Rutas de Empleado (Rol 3)
        const empleadoRoutes = [
            "/dashboardEmpleado",
            "/Paciente",
            "/Agenda",
            "/ProductoServicio",
            "/HistorialCita",
            "/Pago",
            "/Roles",
            "/Empleado",
            "/configuracion",
            "/RolesPermiso"
        ];

        // 1. Validar acceso a rutas exclusivas de Admin
        if (adminRoutes.some(route => path.startsWith(route)) && !empleadoRoutes.some(route => path.startsWith(route))) {
            // Permitir acceso si es Admin (Rol 1 o 2)
            if (userRole !== 1 && userRole !== 2) {
                console.log(`Acceso denegado a ruta Admin ${path}. Rol usuario: ${userRole}`);
                // Si es empleado intentando entrar a ruta admin, mandar a su dashboard
                if (userRole === 3) return redirect("/dashboardEmpleado");
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
