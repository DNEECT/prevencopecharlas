import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  public async excelToJson(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        try {
          const arrayBuffer = e.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(arrayBuffer);
          const worksheet = workbook.worksheets[0];
          const jsonData: any[] = [];

          worksheet.eachRow((row) => {
            jsonData.push(row.values);
          });

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  public async jsonToExcel(data: any[], fileName: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Datos');

    // Agregar encabezados
    worksheet.addRow(Object.keys(data[0]));

    // Agregar datos
    data.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    this.saveAsExcelFile(buffer, fileName);
  }

  private saveAsExcelFile(buffer: BlobPart, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(data, `${fileName}_export_${new Date().getTime()}.xlsx`);
  }

  public async exportSheetWithDetailsAndTable(params: {
    sheetName?: string;
    details: Record<string, any>;
    tableHeaders: string[];
    tableRows: Record<string, any>[];
    fileName?: string;
  }): Promise<void> {
    const { sheetName = 'Sheet1', details, tableHeaders, tableRows, fileName = 'export' } = params;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Escribir detalles (clave / valor)
    const detailKeys = Object.keys(details || {});
    for (const key of detailKeys) {
      const value = details[key] ?? '';
      const row = worksheet.addRow([key, String(value)]);
      row.getCell(1).font = { bold: true };
    }

    // fila en blanco
    worksheet.addRow([]);

    // Encabezados de la tabla de participantes
    const headers =
      tableHeaders && tableHeaders.length
        ? tableHeaders
        : tableRows[0]
          ? Object.keys(tableRows[0])
          : [];
    if (headers.length > 0) {
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    // Filas de la tabla
    for (const r of tableRows) {
      const rowValues = headers.map((h) => {
        const v = r[h];
        if (typeof v === 'boolean') return v ? 'X' : '';
        return v ?? '';
      });
      worksheet.addRow(rowValues);
    }

    // Ajuste de ancho de columnas simple
    const allRows = [
      ...detailKeys.map((k) => [k, String(details[k] ?? '')]),
      [],
      headers,
      ...tableRows.map((tr) => headers.map((h) => String(tr[h] ?? ''))),
    ];
    const colCount = Math.max(2, headers.length);
    for (let i = 1; i <= colCount; i++) {
      const colValues = allRows.map((r) => (r[i - 1] ? String(r[i - 1]) : ''));
      const maxLen = Math.max(...colValues.map((v) => v.length), 10);
      worksheet.getColumn(i).width = Math.min(Math.max(maxLen + 2, 10), 60);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${fileName}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`);
  }
}
