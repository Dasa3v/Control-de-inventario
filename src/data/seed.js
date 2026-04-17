export const administrativeRoles = [
  "Jefe de seguridad",
  "Aprendiz",
  "Talento humano",
];

export const operativeRoles = [
  "Auxiliar de almacen",
  "Verificador",
  "Supervisor",
  "Operador integral",
];

export const initialPeople = [
  { id: "adm-1", name: "Laura Cardenas", document: "1023456781", role: "Jefe de seguridad", type: "administrativo" },
  { id: "adm-2", name: "Camilo Reyes", document: "1032456782", role: "Aprendiz", type: "administrativo" },
  { id: "adm-3", name: "Diana Torres", document: "1041456783", role: "Talento humano", type: "administrativo" },
  { id: "op-1", name: "Jhon Perez", document: "1051456784", role: "Auxiliar de almacen", type: "operativo" },
  { id: "op-2", name: "Andres Herrera", document: "1061456785", role: "Verificador", type: "operativo" },
  { id: "op-3", name: "Martha Silva", document: "1071456786", role: "Supervisor", type: "operativo" },
  { id: "op-4", name: "Oscar Medina", document: "1081456787", role: "Operador integral", type: "operativo" },
];

export const initialEpps = [
  { id: "epp-1", code: "CAS-001", name: "Casco de seguridad", quantity: 25, minStock: 8 },
  { id: "epp-2", code: "GAF-002", name: "Gafas de proteccion", quantity: 40, minStock: 12 },
  { id: "epp-3", code: "GUA-003", name: "Guantes anticorte", quantity: 9, minStock: 10 },
  { id: "epp-4", code: "BOT-004", name: "Botas de seguridad", quantity: 0, minStock: 6 },
];

export const initialMovements = [];
