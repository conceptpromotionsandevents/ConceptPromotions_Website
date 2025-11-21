import React, { useState, useEffect } from "react";
import Select from "react-select";

const BUSINESS_TYPES = [
  "Grocery Retailer",
  "Wholesale",
  "Key Accounts",
  "Salon / Beauty Parlour",
  "Self Service Outlet",
  "Chemist Outlet",
  "Other",
];

const AssignCampaign = () => {
  const [assignType, setAssignType] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);

  const [state, setState] = useState(null);
  const [businessType, setBusinessType] = useState(null);
  const [futureField, setFutureField] = useState(null);

  const [stateList, setStateList] = useState([]);

  const [tableData, setTableData] = useState([]);   // ✅ DATA FOR TABLE
  const [selectedRetailer, setSelectedRetailer] = useState(null); // ✅ SELECTED

  // ✅ Fetch States
  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://supreme-419p.onrender.com/api/admin/retailers",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) return;

      const states = [
        ...new Set(data.retailers?.map((r) => r?.shopDetails?.shopAddress?.state)),
      ]
        .filter((x) => x)
        .map((s) => ({ value: s, label: s }));

      setStateList(states);
    } catch (err) {
      console.log("State Fetch Error:", err);
    }
  };

  // ✅ Fetch filtered retailers to table
  const handleContinue = async () => {
    if (!(assignType === "individual" && assignTarget === "retailer"))
      return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://supreme-419p.onrender.com/api/admin/retailers",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      if (!res.ok) return;

      let filtered = data.retailers;

      if (state) {
        filtered = filtered.filter(
          (r) => r.shopDetails?.shopAddress?.state === state.value
        );
      }

      if (businessType) {
        filtered = filtered.filter(
          (r) => r.shopDetails?.businessType === businessType.value
        );
      }

      setTableData(filtered);
    } catch (e) {
      console.log(e);
    }
  };

  const handleAssign = () => {
    if (!selectedRetailer) {
      alert("Select retailer first");
      return;
    }

    console.log("ASSIGN → ", selectedRetailer);
    alert("Assigned ✅ (console log)");
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-[#E4002B] mb-4">
        Assign Campaign
      </h2>

      {/* ✅ STEP 1 — ASSIGN TYPE */}
      <p className="font-semibold mb-2">Assignment Type</p>
      <Select
        value={assignType ? { label: assignType, value: assignType } : null}
        onChange={(e) => {
          setAssignType(e.value);
          setAssignTarget(null);
          setState(null);
          setBusinessType(null);
          setFutureField(null);
          setTableData([]);
        }}
        options={[
          { label: "Individual Assign", value: "individual" },
          { label: "Bulk Assign", value: "bulk" },
        ]}
        className="mb-4 w-60"
        placeholder="Select assign type"
      />

      {/* ✅ STEP 2 — ASSIGN TO */}
      {assignType && (
        <>
          <p className="font-semibold mt-4 mb-2">Assign To</p>
          <Select
            value={assignTarget ? { label: assignTarget, value: assignTarget } : null}
            onChange={(e) => {
              setAssignTarget(e.value);
              setState(null);
              setBusinessType(null);
              setFutureField(null);
              setTableData([]);
            }}
            options={[
              { label: "Retailer", value: "retailer" },
              { label: "Employee", value: "employee" },
            ]}
            className="mb-4 w-60"
            placeholder="Select target"
          />
        </>
      )}

      {/* ✅ STEP 3 — FILTERS ONLY FOR INDIVIDUAL ASSIGN */}
      {assignType === "individual" && assignTarget === "retailer" && (
        <>
          <hr className="my-4" />
          <p className="font-semibold mb-2">Select Filters</p>

          {/* ✅ State */}
          <Select
            value={state}
            onChange={setState}
            options={stateList}
            placeholder="State"
            className="mb-4 w-60"
            isSearchable
          />

          {/* ✅ Business Type */}
          <Select
            value={businessType}
            onChange={setBusinessType}
            options={BUSINESS_TYPES.map((b) => ({
              label: b,
              value: b,
            }))}
            placeholder="Business Type"
            className="mb-4 w-60"
            isSearchable
          />

          {/* ✅ Future Use */}
          <Select
            value={futureField}
            onChange={setFutureField}
            options={[
              { label: "Option-1", value: "1" },
              { label: "Option-2", value: "2" },
            ]}
            placeholder="Future Use"
            className="mb-4 w-60"
            isSearchable
          />

          <button
            onClick={handleContinue}
            className="bg-[#E4002B] text-white px-4 py-2 rounded-md"
          >
            Continue
          </button>
        </>
      )}

      {/* ✅ TABLE APPEARS BELOW */}
      {tableData.length > 0 && (
        <div className="mt-8">
          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Select</th>
                <th className="border p-2">S.No</th>
                <th className="border p-2">Outlet Name</th>
                <th className="border p-2">Business Type</th>
                <th className="border p-2">City</th>
                <th className="border p-2">State</th>
              </tr>
            </thead>

            <tbody>
              {tableData.map((r, index) => (
                <tr key={r._id} className="text-center">
                  <td className="border p-2">
                    <input
                      type="radio"
                      name="selectedRetailer"
                      onChange={() => setSelectedRetailer(r._id)}
                      checked={selectedRetailer === r._id}
                    />
                  </td>
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">{r.name}</td>
                  <td className="border p-2">{r?.shopDetails?.businessType}</td>
                  <td className="border p-2">{r?.shopDetails?.shopAddress?.city}</td>
                  <td className="border p-2">{r?.shopDetails?.shopAddress?.state}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ASSIGN BUTTON */}
          <button
            onClick={handleAssign}
            className="bg-green-600 text-white px-4 py-2 rounded-md mt-4"
          >
            Assign
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignCampaign;
