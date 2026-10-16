import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { ELECTORAL_PROCESS } from './electoral-process.const';

export const ASSISTANT_TYPE = {
  NOT_APPLICABLE: 'f2ca6657-8c06-4440-b0a9-d4321424b97e',
} as const;

export function showAssistantTypeField(processId?: string | null): boolean {
  return !!processId && processId !== ELECTORAL_PROCESS.ERM_2026;
}

export function getInternalAssistantType(processId?: string | null): AutoCompleteData | null {
  return processId === ELECTORAL_PROCESS.ERM_2026
    ? { key: ASSISTANT_TYPE.NOT_APPLICABLE, value: 'No aplica' }
    : null;
}
