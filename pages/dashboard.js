import { EuiBasicTable, EuiCheckbox, EuiButton } from "@elastic/eui";
import { fetchAllFilters } from "../db/initializeFirestore";
import useFirebaseAuth from "../hooks/useFirebaseAuth";
import { useEffect, useState } from "react";
import { toggleFilter, deleteFilter } from "../db/initializeFirestore";
import Head from "next/head";
import Multifield from "../components/multifield/Multifield";
import { getGenres } from "./api/genres";
import shortid from "shortid";
import { firestore } from "firebase";

export default function ({ genres }) {
  const { user } = useFirebaseAuth();
  const [allFilterRules, setAllFilterRules] = useState(new Map());
  const [dashboardView, setDashboardView] = useState(true);
  const [editState, setEditState] = useState();
  useEffect(() => {
    async function asyncFetch(uid) {
      if (user) {
        const data = await fetchAllFilters(uid);
        //inject userId into each row of table, so deleteFilter can access userId
        for (let [key, value] of Object.entries(data.filters)) {
          data.filters[key] = { ...value, uid };
        }
        setAllFilterRules(new Map(Object.entries(data.filters)));
      }
    }
    asyncFetch(user?.uid);
  }, [user]);
  const editFilter = (rule) => {
    const editState = firestoreToLocalState(rule);
    setEditState(editState);
    setDashboardView(false);
  };
  const deleteFilterStateAndFirestore = function (rule) {
    deleteFilter(rule);
    setAllFilterRules((prev) => {
      const newMap = new Map(prev);
      newMap.delete(rule.filterId);
      return newMap;
    });
  };
  const actions = [
    {
      name: "Edit",
      description: "Edit this rule",
      icon: "documentEdit",
      type: "icon",
      onClick: editFilter,
    },
    {
      name: "Delete",
      description: "Delete this rule",
      icon: "trash",
      type: "icon",
      color: "danger",
      onClick: deleteFilterStateAndFirestore,
    },
  ];
  const columns = [
    { field: "name", name: "Name", sortable: true },
    {
      field: "enabled",
      name: "Enabled",
      dataType: "boolean",
      render: (enabled, filter) => (
        <EuiCheckbox
          checked={enabled}
          onChange={() => {
            //change local state
            setAllFilterRules((prev) => {
              const newMap = new Map(prev);
              const oldFilterRule = newMap.get(filter.filterId);
              const newFilterRule = { ...oldFilterRule, enabled: !enabled };
              newMap.set(filter.filterId, newFilterRule);
              return newMap;
            });
            //change firestore
            toggleFilter(user.uid, filter.filterId, !enabled);
          }}
        />
      ),
    },
    { name: "Actions", actions },
  ];

  function firestoreToLocalState(firestoreObj) {
    //map [uid, object]
    //object: {filterId: '', match: '', enabled: bool, type: [], uid: ''}
    //convert to
    //map ["lxkl8gj", { type: "cast", value: "" }]
    //and {name:'', match: ''}

    let outputObj = {};
    outputObj.filterId = firestoreObj.filterId;
    outputObj.filter = new Map();
    outputObj.form = { name: firestoreObj.name, match: firestoreObj.match };
    for (const [key, value] of Object.entries(firestoreObj)) {
      if (
        key === "cast" ||
        key === "director" ||
        key === "genre" ||
        key === "productionCompany"
      ) {
        for (const filterRule of value) {
          outputObj.filter.set(shortid.generate(), {
            value: filterRule,
            type: key,
          });
        }
      }
    }
    console.log(outputObj.filter);
    return outputObj;
  }

  return (
    <>
      {dashboardView && (
        <>
          <p>Dashboard</p>
          <EuiBasicTable
            // consolidate map values to array
            items={Array.from(allFilterRules.values())}
            columns={columns}
            responsive={false}
          />

          <EuiButton
            onClick={() => {
              setDashboardView(false);
            }}
          >
            Create New
          </EuiButton>
        </>
      )}
      {!dashboardView && (
        <main>
          <Multifield
            genres={genres}
            setDashboardView={setDashboardView}
            setAllFilterRules={setAllFilterRules}
            editState={editState}
          />
        </main>
      )}
    </>
  );
}
export async function getStaticProps() {
  const genres = await getGenres();
  return {
    props: { genres },
  };
}
