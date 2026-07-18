/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        // La escribe el middleware tras verificar el JWT.
        user?: {
            id: number;
            email: string;
            idrol: number;
            firstname: string;
            lastname: string;
        };
    }
}
