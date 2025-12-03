// src/app/services/auth.service.ts

// This file simply re-uses the real AuthService from core/auth.service.
// That way, any old imports from "../services/auth.service"
// will still work correctly without breaking the app.

export * from '../core/auth.service';
