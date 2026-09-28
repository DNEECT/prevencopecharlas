import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { ElectoralprocessRepository } from '@modules/activity-register/repository/electoralprocess.repository';
import { ProcesoElectoralDatosResponse } from '@modules/activity-register/interface/electoralprocess';

export function mapElectoralProcesses(response: ProcesoElectoralDatosResponse): AutoCompleteData[] {
  return response.datos.map((process) => ({
    key: process.codigoProcesoElectoral,
    value: process.nombre,
    isDefault: process.esPredeterminado,
  }));
}

export function getDefaultElectoralProcess(options: AutoCompleteData[]): AutoCompleteData | null {
  return options.find((option) => option.isDefault) ?? null;
}

export function getActivityListDefaultElectoralProcess(
  options: AutoCompleteData[],
): AutoCompleteData | null {
  return options.length === 1 ? getDefaultElectoralProcess(options) : null;
}

@Injectable({
  providedIn: 'root',
})
export class ElectoralprocessService {
  private readonly electoralprocessRepostory: ElectoralprocessRepository = inject(
    ElectoralprocessRepository,
  );

  public select(includeReadOnly: boolean = false): Observable<AutoCompleteData[]> {
    return this.electoralprocessRepostory.listar(includeReadOnly).pipe(map(mapElectoralProcesses));
  }

  public getDefault(options: AutoCompleteData[]): AutoCompleteData | null {
    return getDefaultElectoralProcess(options);
  }

  public getActivityListDefault(options: AutoCompleteData[]): AutoCompleteData | null {
    return getActivityListDefaultElectoralProcess(options);
  }
}
