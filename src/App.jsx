import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  LogIn,
  PackagePlus,
  ShieldCheck,
  X,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import {
  administrativeRoles,
  initialEpps,
  initialPeople,
  operativeRoles,
} from "./data/seed";
import { exportMovementsToExcel } from "./lib/exportExcel";
import { createId, formatDateTime, getStockStatus, getSummary } from "./lib/helpers";
import { database, databaseMode } from "./lib/storage";

const adminCredentials = { username: "admin", password: "1234" };

const emptyMovementForm = {
  type: "salida",
  eppId: "",
  quantity: 1,
  deliveredById: "",
  receivedById: "",
  notes: "",
};

const emptyPersonForm = {
  name: "",
  document: "",
  role: "",
  type: "administrativo",
};

const emptyEppForm = {
  code: "",
  name: "",
  quantity: 0,
  minStock: 5,
};

export default function App() {
  const [people, setPeople] = useState([]);
  const [epps, setEpps] = useState([]);
  const [movements, setMovements] = useState([]);
  const [movementForm, setMovementForm] = useState(emptyMovementForm);
  const [personForm, setPersonForm] = useState(emptyPersonForm);
  const [eppForm, setEppForm] = useState(emptyEppForm);
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingEppId, setEditingEppId] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [loginForm, setLoginForm] = useState(adminCredentials);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await database.getAll();
        setPeople(data.people.length ? data.people : initialPeople);
        setEpps(data.epps.length ? data.epps : initialEpps);
        setMovements(data.movements || []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!people.length || !epps.length) {
      return;
    }

    const administrative = people.find((person) => person.type === "administrativo");
    const operational = people.find((person) => person.type === "operativo");

    setMovementForm((current) => ({
      ...current,
      eppId: current.eppId || epps[0]?.id || "",
      deliveredById: current.deliveredById || administrative?.id || "",
      receivedById: current.receivedById || operational?.id || administrative?.id || "",
    }));

    setPersonForm((current) => ({
      ...current,
      role: current.role || administrativeRoles[0],
    }));
  }, [people, epps]);

  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setError("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setFeedback("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [feedback]);

  const summary = useMemo(() => getSummary(movements), [movements]);
  const totalStock = useMemo(
    () => epps.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [epps],
  );
  const lowStockCount = useMemo(
    () => epps.filter((item) => item.quantity > 0 && item.quantity <= item.minStock).length,
    [epps],
  );
  const outOfStockCount = useMemo(
    () => epps.filter((item) => item.quantity <= 0).length,
    [epps],
  );

  const administrativePeople = people.filter((person) => person.type === "administrativo");
  const recipientPeople = people;
  const selectedDeliveredBy = people.find((person) => person.id === movementForm.deliveredById);
  const selectedReceivedBy = people.find((person) => person.id === movementForm.receivedById);

  const syncState = async (nextState, successMessage) => {
    setSaving(true);
    setError("");
    setFeedback("");

    try {
      await database.saveAll(nextState);
      setFeedback(successMessage);
    } catch (saveError) {
      setError(saveError?.message || "Ocurrio un error al guardar la operacion. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleMovementSubmit = async (event) => {
    event.preventDefault();

    const quantity = Number(movementForm.quantity);
    const selectedEpp = epps.find((item) => item.id === movementForm.eppId);

    if (!selectedEpp || quantity <= 0) {
      setError("Selecciona un EPP valido y una cantidad mayor a cero.");
      return;
    }

    if (movementForm.type === "salida" && !movementForm.receivedById) {
      setError("Selecciona quien recibe el EPP para registrar la salida.");
      return;
    }

    if (movementForm.type === "salida" && selectedEpp.quantity < quantity) {
      setError("No hay suficiente equipo disponible para completar esta salida.");
      return;
    }

    const updatedEpps = epps.map((item) =>
      item.id !== movementForm.eppId
        ? item
        : {
            ...item,
            quantity:
              movementForm.type === "entrada"
                ? item.quantity + quantity
                : item.quantity - quantity,
          },
    );

    const nextMovements = [
      {
        id: createId("mov"),
        ...movementForm,
        quantity,
        deliveredByName: selectedDeliveredBy?.name || "No disponible",
        deliveredByDocument: selectedDeliveredBy?.document || "No disponible",
        receivedById: movementForm.type === "entrada" ? null : movementForm.receivedById,
        receivedByName:
          movementForm.type === "entrada"
            ? "Almacen"
            : selectedReceivedBy?.name || "No disponible",
        receivedByDocument:
          movementForm.type === "entrada"
            ? "No aplica"
            : selectedReceivedBy?.document || "No disponible",
        createdAt: new Date().toISOString(),
      },
      ...movements,
    ];

    setEpps(updatedEpps);
    setMovements(nextMovements);

    await syncState(
      { people, epps: updatedEpps, movements: nextMovements },
      `Movimiento de ${movementForm.type} registrado correctamente.`,
    );

    setMovementForm((current) => ({
      ...emptyMovementForm,
      type: current.type,
      eppId: current.eppId,
      deliveredById: administrativePeople[0]?.id || "",
      receivedById: "",
    }));
  };

  const handleLogin = (event) => {
    event.preventDefault();

    if (
      loginForm.username === adminCredentials.username &&
      loginForm.password === adminCredentials.password
    ) {
      setIsAdminLogged(true);
      setError("");
      setFeedback("Acceso administrativo concedido.");
      return;
    }

    setError("Credenciales invalidas. Usa usuario admin y contraseña 1234.");
  };

  const handlePersonSubmit = async (event) => {
    event.preventDefault();

    const payload = { ...personForm, id: editingPersonId || createId("person") };
    const nextPeople = editingPersonId
      ? people.map((person) => (person.id === editingPersonId ? payload : person))
      : [payload, ...people];

    setPeople(nextPeople);
    await syncState(
      { people: nextPeople, epps, movements },
      editingPersonId ? "Personal actualizado correctamente." : "Personal agregado correctamente.",
    );

    setPersonForm({ ...emptyPersonForm, type: "administrativo", role: administrativeRoles[0] });
    setEditingPersonId(null);
  };

  const handleEppSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...eppForm,
      id: editingEppId || createId("epp"),
      quantity: Number(eppForm.quantity),
      minStock: Number(eppForm.minStock),
    };

    const nextEpps = editingEppId
      ? epps.map((item) => (item.id === editingEppId ? payload : item))
      : [payload, ...epps];

    setEpps(nextEpps);
    await syncState(
      { people, epps: nextEpps, movements },
      editingEppId ? "EPP actualizado correctamente." : "EPP agregado correctamente.",
    );

    setEppForm(emptyEppForm);
    setEditingEppId(null);
  };

  const deletePerson = async (personId) => {
    const nextPeople = people.filter((person) => person.id !== personId);
    const nextMovements = movements.map((movement) => ({
      ...movement,
      deliveredById: movement.deliveredById === personId ? null : movement.deliveredById,
      receivedById: movement.receivedById === personId ? null : movement.receivedById,
    }));

    setPeople(nextPeople);
    setMovements(nextMovements);
    await syncState(
      { people: nextPeople, epps, movements: nextMovements },
      "Personal eliminado correctamente. El historial se conserva.",
    );
  };

  const deleteEpp = async (eppId) => {
    const usedInMovements = movements.some((movement) => movement.eppId === eppId);

    if (usedInMovements) {
      setError("No puedes eliminar un EPP que ya aparece en el historial.");
      return;
    }

    const nextEpps = epps.filter((item) => item.id !== eppId);
    setEpps(nextEpps);
    await syncState({ people, epps: nextEpps, movements }, "EPP eliminado correctamente.");
  };

  const startEditPerson = (person) => {
    setEditingPersonId(person.id);
    setPersonForm(person);
  };

  const startEditEpp = (item) => {
    setEditingEppId(item.id);
    setEppForm(item);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        Cargando aplicacion...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 text-white shadow-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                <ShieldCheck size={18} />
                Control de equipos de proteccion personal
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Dashboard de entradas, salidas e inventario de EPP
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-brand-50 sm:text-base">
                Panel publico para registrar movimientos y consultar existencias, con una zona
                administrativa independiente para editar personal y productos mediante login.
              </p>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-brand-50">Modo de datos</p>
              <p className="text-xl font-semibold uppercase tracking-wide">{databaseMode}</p>
              <p className="mt-2 text-sm text-brand-100">
                {databaseMode === "supabase"
                  ? "La app esta conectada a Supabase para despliegue en Vercel."
                  : "La app funciona en modo local de prueba hasta configurar Supabase."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {feedback && !error && (
          <div className="sticky top-4 z-30">
            <div className="mx-auto flex max-w-xl items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-soft">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 shrink-0" size={18} />
                <span>{feedback || "La operacion se realizo con exito."}</span>
              </div>

              <button
                aria-label="Cerrar alerta"
                className="rounded-full p-1 text-white/90 transition hover:bg-white/15 hover:text-white"
                onClick={() => setFeedback("")}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="sticky top-4 z-30">
            <div className="mx-auto flex max-w-xl items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-soft">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <span>{error}</span>
              </div>

              <button
                aria-label="Cerrar alerta"
                className="rounded-full p-1 text-white/90 transition hover:bg-white/15 hover:text-white"
                onClick={() => setError("")}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Entradas registradas" value={summary.entries} icon={ArrowDownToLine} />
          <SummaryCard title="Salidas registradas" value={summary.exits} icon={ArrowUpFromLine} />
          <SummaryCard title="Unidades disponibles" value={totalStock} icon={Boxes} />
          <SummaryCard title="Alertas de stock" value={lowStockCount + outOfStockCount} icon={AlertCircle} />
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-3">
              <PackagePlus className="text-brand-700" />
              <div>
                <h2 className="text-xl font-semibold">Registrar movimiento</h2>
                <p className="text-sm text-slate-500">
                  En entradas el EPP vuelve al almacen. En salidas un administrativo puede
                  entregarle a personal operativo o a otro administrativo.
                </p>
              </div>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleMovementSubmit}>
              <Field label="Tipo de movimiento">
                <select
                  className="input"
                  value={movementForm.type}
                  onChange={(event) =>
                    setMovementForm((current) => ({
                      ...current,
                      type: event.target.value,
                      receivedById: "",
                    }))
                  }
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
              </Field>

              <Field label="EPP">
                <select
                  className="input"
                  value={movementForm.eppId}
                  onChange={(event) =>
                    setMovementForm((current) => ({ ...current, eppId: event.target.value }))
                  }
                >
                  {epps.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Cantidad">
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={movementForm.quantity}
                  onChange={(event) =>
                    setMovementForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Entregado por">
                <select
                  className="input"
                  value={movementForm.deliveredById}
                  onChange={(event) =>
                    setMovementForm((current) => ({
                      ...current,
                      deliveredById: event.target.value,
                    }))
                  }
                >
                  {administrativePeople.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} - {person.role}
                    </option>
                  ))}
                </select>
                <PersonDocumentHint person={selectedDeliveredBy} />
              </Field>

              {movementForm.type === "salida" && (
                <Field label="Recibido por">
                  <select
                    className="input"
                    value={movementForm.receivedById}
                    onChange={(event) =>
                      setMovementForm((current) => ({
                        ...current,
                        receivedById: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecciona una persona</option>
                    {recipientPeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} - {person.role} - {person.type}
                      </option>
                    ))}
                  </select>
                  <PersonDocumentHint person={selectedReceivedBy} />
                </Field>
              )}

              <Field label="Observaciones">
                <input
                  className="input"
                  value={movementForm.notes}
                  onChange={(event) =>
                    setMovementForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Detalle opcional"
                />
              </Field>

              <div className="md:col-span-2">
                <button className="btn btn-green" disabled={saving} type="submit">
                  Guardar movimiento
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-3">
              <UserCog className="text-brand-700" />
              <div>
                <h2 className="text-xl font-semibold">Seccion administrativa</h2>
                <p className="text-sm text-slate-500">
                  El dashboard es libre. El login solo protege agregar, editar y eliminar.
                </p>
              </div>
            </div>

            {!isAdminLogged ? (
              <form className="grid gap-4" onSubmit={handleLogin}>
                <Field label="Usuario">
                  <input
                    className="input"
                    value={loginForm.username}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, username: event.target.value }))
                    }
                  />
                </Field>

                <Field label="Contraseña">
                  <input
                    className="input"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </Field>

                <button className="btn bg-brand-700 text-white hover:bg-brand-800" type="submit">
                  <span className="inline-flex items-center gap-2">
                    <LogIn size={18} />
                    Ingresar a administracion
                  </span>
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
                  Sesion iniciada como administrador. Puedes gestionar personal y EPP.
                </div>
                <button
                  className="btn bg-amber-400 text-slate-900 hover:bg-amber-500"
                  onClick={() => setAdminOpen((current) => !current)}
                  type="button"
                >
                  {adminOpen ? "Ocultar panel administrativo" : "Mostrar panel administrativo"}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-brand-700" />
              <div>
                <h2 className="text-xl font-semibold">Inventario actual</h2>
                <p className="text-sm text-slate-500">
                  Vista rapida del almacen con estado de stock por color.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3">Codigo EPP</th>
                  <th className="px-3 py-3">Nombre EPP</th>
                  <th className="px-3 py-3">Cantidad</th>
                  <th className="px-3 py-3">Stock minimo</th>
                  <th className="px-3 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {epps.map((item) => {
                  const status = getStockStatus(item);

                  return (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-medium text-slate-700">{item.code}</td>
                      <td className="px-3 py-4">{item.name}</td>
                      <td className="px-3 py-4">{item.quantity}</td>
                      <td className="px-3 py-4">{item.minStock}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {isAdminLogged && adminOpen && (
          <section className="grid gap-8 xl:grid-cols-2">
            <AdminPanel
              title="Gestion de personal"
              description="Agregar, editar o eliminar personal administrativo y operativo."
              icon={Users}
            >
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePersonSubmit}>
                <Field label="Nombre">
                  <input
                    className="input"
                    value={personForm.name}
                    onChange={(event) =>
                      setPersonForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Cedula">
                  <input
                    className="input"
                    value={personForm.document}
                    onChange={(event) =>
                      setPersonForm((current) => ({ ...current, document: event.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    className="input"
                    value={personForm.type}
                    onChange={(event) =>
                      setPersonForm((current) => ({
                        ...current,
                        type: event.target.value,
                        role:
                          event.target.value === "administrativo"
                            ? administrativeRoles[0]
                            : operativeRoles[0],
                      }))
                    }
                  >
                    <option value="administrativo">Administrativo</option>
                    <option value="operativo">Operativo</option>
                  </select>
                </Field>
                <Field label="Cargo">
                  <select
                    className="input"
                    value={personForm.role}
                    onChange={(event) =>
                      setPersonForm((current) => ({ ...current, role: event.target.value }))
                    }
                  >
                    {(personForm.type === "administrativo"
                      ? administrativeRoles
                      : operativeRoles
                    ).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button className="btn btn-green" disabled={saving} type="submit">
                    {editingPersonId ? "Actualizar personal" : "Agregar personal"}
                  </button>
                  {editingPersonId && (
                    <button
                      className="btn bg-slate-200 text-slate-700 hover:bg-slate-300"
                      onClick={() => {
                        setEditingPersonId(null);
                        setPersonForm({
                          ...emptyPersonForm,
                          type: "administrativo",
                          role: administrativeRoles[0],
                        });
                      }}
                      type="button"
                    >
                      Cancelar edicion
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {people.map((person) => (
                  <ListCard
                    key={person.id}
                    title={person.name}
                    subtitle={`${person.type} | ${person.role} | CC ${person.document}`}
                    onEdit={() => startEditPerson(person)}
                    onDelete={() => deletePerson(person.id)}
                  />
                ))}
              </div>
            </AdminPanel>

            <AdminPanel
              title="Gestion de EPP"
              description="Agregar, editar o eliminar tipos de equipos de proteccion personal."
              icon={Boxes}
            >
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleEppSubmit}>
                <Field label="Codigo EPP">
                  <input
                    className="input"
                    value={eppForm.code}
                    onChange={(event) =>
                      setEppForm((current) => ({ ...current, code: event.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Nombre del EPP">
                  <input
                    className="input"
                    value={eppForm.name}
                    onChange={(event) =>
                      setEppForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Cantidad actual">
                  <input
                    className="input"
                    min="0"
                    type="number"
                    value={eppForm.quantity}
                    onChange={(event) =>
                      setEppForm((current) => ({ ...current, quantity: event.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Stock minimo">
                  <input
                    className="input"
                    min="0"
                    type="number"
                    value={eppForm.minStock}
                    onChange={(event) =>
                      setEppForm((current) => ({ ...current, minStock: event.target.value }))
                    }
                    required
                  />
                </Field>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button className="btn btn-green" disabled={saving} type="submit">
                    {editingEppId ? "Actualizar EPP" : "Agregar EPP"}
                  </button>
                  {editingEppId && (
                    <button
                      className="btn bg-slate-200 text-slate-700 hover:bg-slate-300"
                      onClick={() => {
                        setEditingEppId(null);
                        setEppForm(emptyEppForm);
                      }}
                      type="button"
                    >
                      Cancelar edicion
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {epps.map((item) => (
                  <ListCard
                    key={item.id}
                    title={`${item.code} - ${item.name}`}
                    subtitle={`Cantidad ${item.quantity} | Minimo ${item.minStock}`}
                    onEdit={() => startEditEpp(item)}
                    onDelete={() => deleteEpp(item.id)}
                  />
                ))}
              </div>
            </AdminPanel>
          </section>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-brand-700" />
              <div>
                <h2 className="text-xl font-semibold">Historial descargable</h2>
                <p className="text-sm text-slate-500">
                  Descarga el registro en Excel con fecha, hora, entregas y recepciones.
                </p>
              </div>
            </div>

            <button
              className="btn bg-brand-700 text-white hover:bg-brand-800"
              onClick={() => exportMovementsToExcel(movements, epps, people)}
              type="button"
            >
              Descargar Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3">Fecha y hora</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">EPP</th>
                  <th className="px-3 py-3">Cantidad</th>
                  <th className="px-3 py-3">Entrego</th>
                  <th className="px-3 py-3">Recibio</th>
                  <th className="px-3 py-3">Nota</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => {
                  const epp = epps.find((item) => item.id === movement.eppId);

                  return (
                    <tr key={movement.id} className="border-b border-slate-100">
                      <td className="px-3 py-4">{formatDateTime(movement.createdAt)}</td>
                      <td className="px-3 py-4 capitalize">{movement.type}</td>
                      <td className="px-3 py-4">{epp ? `${epp.code} - ${epp.name}` : "No disponible"}</td>
                      <td className="px-3 py-4">{movement.quantity}</td>
                      <td className="px-3 py-4">{movement.deliveredByName || "No disponible"}</td>
                      <td className="px-3 py-4">
                        {movement.receivedByName || "No disponible"}
                      </td>
                      <td className="px-3 py-4">{movement.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon }) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <Icon size={22} />
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </article>
  );
}

function AdminPanel({ title, description, icon: Icon, children }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <div className="mb-6 flex items-center gap-3">
        <Icon className="text-brand-700" />
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function PersonDocumentHint({ person }) {
  if (!person) {
    return (
      <p className="mt-2 text-xs text-slate-400">
        C.C: pendiente por seleccionar
      </p>
    );
  }

  return (
    <p className="mt-2 text-xs font-medium text-brand-700">
      C.C: {person.document}
    </p>
  );
}

function ListCard({ title, subtitle, onEdit, onDelete }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex gap-3">
        <button className="btn btn-yellow" onClick={onEdit} type="button">
          Editar
        </button>
        <button className="btn btn-red inline-flex items-center gap-2" onClick={onDelete} type="button">
          <Trash2 size={16} />
          Borrar
        </button>
      </div>
    </article>
  );
}
