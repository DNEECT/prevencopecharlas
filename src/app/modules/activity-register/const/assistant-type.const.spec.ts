import { ELECTORAL_PROCESS } from './electoral-process.const';
import {
  ASSISTANT_TYPE,
  getInternalAssistantType,
  showAssistantTypeField,
} from './assistant-type.const';

describe('ERM 2026 assistant type', () => {
  it('hides the field and supplies the internal No aplica value for ERM 2026', () => {
    expect(showAssistantTypeField(ELECTORAL_PROCESS.ERM_2026)).toBeFalse();
    expect(getInternalAssistantType(ELECTORAL_PROCESS.ERM_2026)).toEqual({
      key: ASSISTANT_TYPE.NOT_APPLICABLE,
      value: 'No aplica',
    });
  });

  it('keeps the field visible for historical processes', () => {
    expect(showAssistantTypeField(ELECTORAL_PROCESS.GENERAL_2026)).toBeTrue();
    expect(getInternalAssistantType(ELECTORAL_PROCESS.GENERAL_2026)).toBeNull();
  });

  it('keeps the field hidden while no process has been selected', () => {
    expect(showAssistantTypeField(null)).toBeFalse();
  });
});
