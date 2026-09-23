import { getDefaultElectoralProcess, mapElectoralProcesses } from './electoralprocess.service';

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
});
