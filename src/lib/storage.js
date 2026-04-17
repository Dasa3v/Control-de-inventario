import { createClient } from "@supabase/supabase-js";
import { initialEpps, initialMovements, initialPeople } from "../data/seed";

const STORAGE_KEY = "epp-control-app-data";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

const getLocalState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const seeded = { people: initialPeople, epps: initialEpps, movements: initialMovements };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  return JSON.parse(raw);
};

const saveLocalState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const localDb = {
  async getAll() {
    const state = getLocalState();
    return {
      ...state,
      movements: addMovementSnapshots(state.movements, state.people),
    };
  },
  async saveAll(state) {
    saveLocalState(state);
    return state;
  },
};

const mapPersonFromDb = (person) => ({
  id: person.id,
  name: person.name,
  document: person.document,
  role: person.role,
  type: person.type,
});

const mapPersonToDb = (person) => ({
  id: person.id,
  name: person.name,
  document: person.document,
  role: person.role,
  type: person.type,
  created_at: new Date().toISOString(),
});

const mapEppFromDb = (item) => ({
  id: item.id,
  code: item.code,
  name: item.name,
  quantity: item.quantity,
  minStock: item.min_stock,
});

const mapEppToDb = (item) => ({
  id: item.id,
  code: item.code,
  name: item.name,
  quantity: item.quantity,
  min_stock: item.minStock,
  created_at: new Date().toISOString(),
});

const mapMovementFromDb = (movement) => ({
  id: movement.id,
  type: movement.type,
  eppId: movement.epp_id,
  quantity: movement.quantity,
  deliveredById: movement.delivered_by_id,
  deliveredByName: movement.delivered_by_name,
  deliveredByDocument: movement.delivered_by_document,
  receivedById: movement.received_by_id,
  receivedByName: movement.received_by_name,
  receivedByDocument: movement.received_by_document,
  createdAt: movement.created_at,
  notes: movement.notes || "",
});

const mapMovementToDb = (movement) => ({
  id: movement.id,
  type: movement.type,
  epp_id: movement.eppId,
  quantity: movement.quantity,
  delivered_by_id: movement.deliveredById || null,
  delivered_by_name: movement.deliveredByName,
  delivered_by_document: movement.deliveredByDocument,
  received_by_id: movement.receivedById || null,
  received_by_name: movement.receivedByName,
  received_by_document: movement.receivedByDocument,
  created_at: movement.createdAt,
  notes: movement.notes || "",
});

const addMovementSnapshots = (movements, people) => {
  const peopleMap = Object.fromEntries(people.map((person) => [person.id, person]));

  return movements.map((movement) => {
    const deliveredPerson = movement.deliveredById ? peopleMap[movement.deliveredById] : null;
    const receivedPerson = movement.receivedById ? peopleMap[movement.receivedById] : null;

    return {
      ...movement,
      deliveredByName:
        movement.deliveredByName || deliveredPerson?.name || "No disponible",
      deliveredByDocument:
        movement.deliveredByDocument || deliveredPerson?.document || "No disponible",
      receivedByName:
        movement.type === "entrada"
          ? movement.receivedByName || "Almacen"
          : movement.receivedByName || receivedPerson?.name || "No disponible",
      receivedByDocument:
        movement.type === "entrada"
          ? movement.receivedByDocument || "No aplica"
          : movement.receivedByDocument || receivedPerson?.document || "No disponible",
    };
  });
};

let remoteDb = null;

if (hasSupabaseConfig) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  remoteDb = {
    async getAll() {
      const [peopleRes, eppsRes, movementsRes] = await Promise.all([
        supabase.from("people").select("*").order("created_at", { ascending: true }),
        supabase.from("epps").select("*").order("created_at", { ascending: true }),
        supabase.from("movements").select("*").order("created_at", { ascending: false }),
      ]);

      if (peopleRes.error || eppsRes.error || movementsRes.error) {
        throw new Error(
          peopleRes.error?.message ||
            eppsRes.error?.message ||
            movementsRes.error?.message ||
            "No se pudo cargar la base de datos.",
        );
      }

      return {
        people: peopleRes.data.map(mapPersonFromDb),
        epps: eppsRes.data.map(mapEppFromDb),
        movements: addMovementSnapshots(
          movementsRes.data.map(mapMovementFromDb),
          peopleRes.data.map(mapPersonFromDb),
        ),
      };
    },
    async saveAll(state) {
      const deleteMovements = await supabase.from("movements").delete().neq("id", "");
      if (deleteMovements.error) {
        throw new Error(deleteMovements.error.message);
      }

      const deletePeople = await supabase.from("people").delete().neq("id", "");
      if (deletePeople.error) {
        throw new Error(deletePeople.error.message);
      }

      const deleteEpps = await supabase.from("epps").delete().neq("id", "");
      if (deleteEpps.error) {
        throw new Error(deleteEpps.error.message);
      }

      const peopleRes = await supabase.from("people").insert(state.people.map(mapPersonToDb));
      const eppsRes = await supabase.from("epps").insert(state.epps.map(mapEppToDb));
      const movementsRes = await supabase
        .from("movements")
        .insert(state.movements.map(mapMovementToDb));

      if (peopleRes.error || eppsRes.error || movementsRes.error) {
        throw new Error(
          peopleRes.error?.message ||
            eppsRes.error?.message ||
            movementsRes.error?.message ||
            "No se pudo guardar la base de datos.",
        );
      }

      return state;
    },
  };
}

export const database = remoteDb ?? localDb;
export const databaseMode = hasSupabaseConfig ? "supabase" : "local";
