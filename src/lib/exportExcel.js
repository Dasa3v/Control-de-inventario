import { formatDateTime } from "./helpers";

export const exportMovementsToExcel = async (movements, epps, people) => {
  const XLSX = await import("xlsx");
  const eppMap = Object.fromEntries(epps.map((item) => [item.id, item]));

  const headers = [
    "Fecha y hora",
    "Tipo",
    "Codigo EPP",
    "Nombre EPP",
    "Cantidad",
    "Entregado por",
    "C.C. entrega",
    "Recibido por",
    "C.C. recibe",
    "Observaciones",
  ];

  const rows = movements.map((movement) => [
    formatDateTime(movement.createdAt),
    movement.type,
    eppMap[movement.eppId]?.code || "No disponible",
    eppMap[movement.eppId]?.name || "No disponible",
    movement.quantity,
    movement.deliveredByName || "No disponible",
    movement.deliveredByDocument || "No disponible",
    movement.receivedByName || "No disponible",
    movement.receivedByDocument || "No disponible",
    movement.notes || "",
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rows.length, c: headers.length - 1 },
    }),
  };

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 16 },
    { wch: 28 },
    { wch: 10 },
    { wch: 24 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 34 },
  ];

  worksheet["!rows"] = [{ hpx: 24 }];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Historial EPP");
  XLSX.writeFile(workbook, `historial-epp-${new Date().toISOString().slice(0, 10)}.xlsx`);
};
