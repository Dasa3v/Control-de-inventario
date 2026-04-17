export const formatDateTime = (value) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

export const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getStockStatus = (item) => {
  if (item.quantity <= 0) {
    return { label: "Agotado", className: "bg-red-100 text-red-700 border-red-200" };
  }

  if (item.quantity <= item.minStock) {
    return { label: "Bajo en stock", className: "bg-amber-100 text-amber-700 border-amber-200" };
  }

  return { label: "Disponible", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
};

export const getSummary = (movements) =>
  movements.reduce(
    (acc, movement) => {
      if (movement.type === "entrada") {
        acc.entries += movement.quantity;
      } else {
        acc.exits += movement.quantity;
      }

      return acc;
    },
    { entries: 0, exits: 0 },
  );
