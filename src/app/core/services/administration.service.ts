import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PermissionDto {
    id: string;
    nom: string;
    description: string | null;
}

export interface RolePermissionsResponse {
    role: string;
    permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AdministrationService {
    private http = inject(HttpClient);

    getAllPermissions(): Observable<PermissionDto[]> {
        return this.http.get<PermissionDto[]>('/api/administration/permissions');
    }

    getAllRolePermissions(): Observable<RolePermissionsResponse[]> {
        return this.http.get<RolePermissionsResponse[]>('/api/administration/permissions/roles');
    }

    updateRolePermissions(role: string, permissions: string[]): Observable<RolePermissionsResponse> {
        return this.http.put<RolePermissionsResponse>(
            `/api/administration/permissions/roles/${role}`,
            { permissions }
        );
    }
}
