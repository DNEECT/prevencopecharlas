import {
  getActivityListDefaultElectoralProcess,
  getDefaultElectoralProcess,
  mapElectoralProcesses,
} from './electoralprocess.service';

describe('ElectoralprocessService', () => {
  it('maps and identifies the configured default electoral process', () => {
    const options = mapElectoralProcesses({
      datos: [
        {
          codigoProcesoElectoral: 'general',
          nombre: 'Elecciones Generales 2026',
          descripcion: '',
          esPredeterminado: false,
        },
        {
          codigoProcesoElectoral: 'regional',
          nombre: 'Elecciones Regionales Municipales 2026',
          descripcion: '',
          esPredeterminado: true,
        },
      ],
    });

    expect(getDefaultElectoralProcess(options)).toEqual({
      key: 'regional',
      value: 'Elecciones Regionales Municipales 2026',
      isDefault: true,
    });
  });

  it('preselects the only authorized current process for a Monitor or Gestor list', () => {
    const erm2026 = {
      key: 'regional',
      value: 'Elecciones Regionales Municipales 2026',
      isDefault: true,
    };

    expect(getActivityListDefaultElectoralProcess([erm2026])).toEqual(erm2026);
  });

  it('leaves the process filter empty when a Director can see multiple processes', () => {
    expect(
      getActivityListDefaultElectoralProcess([
        { key: 'general', value: 'Elecciones Generales 2026', isDefault: false },
        {
          key: 'regional',
          value: 'Elecciones Regionales Municipales 2026',
          isDefault: true,
        },
      ]),
    ).toBeNull();
  });
});
