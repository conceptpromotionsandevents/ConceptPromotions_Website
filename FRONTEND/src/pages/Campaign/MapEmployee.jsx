import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from 'xlsx-js-style';
import { API_URL } from "../../url/base";

const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
        "&:hover": { borderColor: "#E4002B" },
        minHeight: "42px",
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#FEE2E2" : "white",
        color: "#333",
        "&:active": { backgroundColor: "#FECACA" },
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 20,
    }),
};

const MapEmployee = () => {
    // Campaign Selection
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    const [assignedRetailers, setAssignedRetailers] = useState([]);
    const [assignedEmployees, setAssignedEmployees] = useState([]);
    const [loadingAssignedData, setLoadingAssignedData] = useState(false);

    const [selectedRetailers, setSelectedRetailers] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Common Filters
    const [stateFilter, setStateFilter] = useState(null);

    // Separate Search for Retailer and Employee
    const [searchRetailer, setSearchRetailer] = useState("");
    const [searchEmployee, setSearchEmployee] = useState("");

    const [filteredRetailers, setFilteredRetailers] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);

    const [openOutletList, setOpenOutletList] = useState(null);

    // Assigned Pairs Table States
    const [assignedPairs, setAssignedPairs] = useState([]);
    const [filteredPairs, setFilteredPairs] = useState([]);
    const [searchAssignedPairs, setSearchAssignedPairs] = useState("");

    const [pairStateFilter, setPairStateFilter] = useState(null);


    // ✅ Fetch Campaigns
    useEffect(() => {
        fetchCampaigns();
    }, []);

    // Fetch campaigns from backend
    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_URL}/admin/campaigns`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error fetching campaigns", {
                    theme: "dark",
                });
                return;
            }

            // Filter Active Campaigns ONLY
            const activeCampaigns = (data.campaigns || []).filter(
                (c) => c.isActive === true
            );

            const campaignOptions = activeCampaigns.map((c) => ({
                value: c._id,
                label: c.name,
                data: c,
            }));

            setCampaigns(campaignOptions);
        } catch (err) {
            console.log("Campaign Fetch Error:", err);
            toast.error("Failed to load campaigns", { theme: "dark" });
        } finally {
            setLoadingCampaigns(false);
        }
    };

    // ✅ NEW: Check assignment status for each retailer
    const checkRetailerAssignmentStatus = async (campaignId, retailers) => {
        const token = localStorage.getItem("token");

        const updatedRetailers = await Promise.all(
            retailers.map(async (retailer) => {
                try {
                    const res = await fetch(
                        `${API_URL}/admin/campaign/${campaignId}/retailer/${retailer._id}/employee`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );

                    const data = await res.json();

                    if (res.ok && data.isAssigned) {
                        return {
                            ...retailer,
                            status: "assigned",
                            assignedEmployee: data.employee,
                            assignedAt: data.assignedAt
                        };
                    } else {
                        return {
                            ...retailer,
                            status: retailer.status || "pending"
                        };
                    }
                } catch (err) {
                    console.error(`Error checking status for retailer ${retailer._id}:`, err);
                    return {
                        ...retailer,
                        status: retailer.status || "pending"
                    };
                }
            })
        );

        return updatedRetailers;
    };

    // ✅ ADD THIS RIGHT HERE
    const fetchEmployeeRetailerMapping = async (campaignId) => {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `${API_URL}/admin/campaign/${campaignId}/employee-retailer-mapping`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();
        if (!res.ok) return [];

        return data.employees;
    };

    const handleSelectRetailer = (retailerId) => {
        setSelectedRetailers(prev =>
            prev.includes(retailerId)
                ? prev.filter(id => id !== retailerId)
                : [...prev, retailerId]
        );
    };

    const handleSelectEmployee = (employeeId) => {
        setSelectedEmployee(employeeId);
    };

    // Filter Retailers
    useEffect(() => {
        if (!assignedRetailers.length) {
            setFilteredRetailers([]);
            return;
        }

        let filtered = [...assignedRetailers];

        if (stateFilter) {
            filtered = filtered.filter(
                r => r.shopDetails?.shopAddress?.state === stateFilter.value
            );
        }

        if (searchRetailer.trim() !== "") {
            const query = searchRetailer.toLowerCase();
            filtered = filtered.filter(
                r =>
                    r.uniqueId?.toLowerCase().includes(query) ||
                    r.shopDetails?.shopName?.toLowerCase().includes(query)
            );
        }

        setFilteredRetailers(filtered);
    }, [stateFilter, searchRetailer, assignedRetailers]);

    // Filter Employees
    useEffect(() => {
        if (!assignedEmployees.length) {
            setFilteredEmployees([]);
            return;
        }

        let filtered = [...assignedEmployees];

        if (stateFilter) {
            filtered = filtered.filter(
                e => e.correspondenceAddress?.state === stateFilter.value
            );
        }

        if (searchEmployee.trim() !== "") {
            const query = searchEmployee.toLowerCase();
            filtered = filtered.filter(
                e =>
                    e.employeeId?.toLowerCase().includes(query) ||
                    e.name?.toLowerCase().includes(query)
            );
        }

        setFilteredEmployees(filtered);
    }, [stateFilter, searchEmployee, assignedEmployees]);

    // 🔍 Filter Assigned Employee–Retailer Pairs Table
    useEffect(() => {
        if (!assignedPairs.length) {
            setFilteredPairs([]);
            return;
        }

        let filtered = [...assignedPairs];

        // 🆕 Pair-specific state filter
        if (pairStateFilter) {
            filtered = filtered.filter(
                (p) =>
                    p.retailer?.shopDetails?.shopAddress?.state === pairStateFilter.value
            );
        }

        // Search Filter
        if (searchAssignedPairs.trim() !== "") {
            const q = searchAssignedPairs.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.retailer.uniqueId?.toLowerCase().includes(q) ||
                    p.retailer.shopName?.toLowerCase().includes(q) ||
                    p.employee.employeeId?.toLowerCase().includes(q) ||
                    p.employee.name?.toLowerCase().includes(q)
            );
        }

        setFilteredPairs(filtered);
    }, [assignedPairs, pairStateFilter, searchAssignedPairs]);

    const handleCampaignChange = async (selected) => {
        setSelectedCampaign(selected);

        if (!selected) {
            setAssignedRetailers([]);
            setFilteredRetailers([]);
            setSelectedRetailers([]);
            setAssignedEmployees([]);
            setFilteredEmployees([]);
            setSelectedEmployee(null);
            setStateFilter(null);
            setSearchRetailer("");
            setSearchEmployee("");
            return;
        }

        setLoadingAssignedData(true);

        // Reset data
        setAssignedRetailers([]);
        setFilteredRetailers([]);
        setSelectedRetailers([]);
        setAssignedEmployees([]);
        setFilteredEmployees([]);
        setSelectedEmployee(null);
        setStateFilter(null);
        setSearchRetailer("");
        setSearchEmployee("");

        try {
            const token = localStorage.getItem("token");

            // 1️⃣ Fetch retailers + employees
            const res = await fetch(
                `${API_URL}/admin/campaign/${selected.value}/retailers-with-employees`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error loading campaign data", {
                    theme: "dark",
                });
                return;
            }

            const retailers = data.retailers || [];
            const employees = data.employees || [];

            // 2️⃣ Check retailer assignment status
            const retailersWithStatus = await checkRetailerAssignmentStatus(
                selected.value,
                retailers
            );

            setAssignedRetailers(retailersWithStatus);
            setFilteredRetailers(retailersWithStatus);

            // 3️⃣ Fetch employee → retailer mapping API
            const mapping = await fetchEmployeeRetailerMapping(selected.value);

            // 4️⃣ Merge mapping with employees
            const employeesWithOutletCounts = employees.map((emp) => {
                const found = mapping.find((m) => m._id === emp._id);

                return {
                    ...emp,
                    outletCount: found ? found.retailers.length : 0,
                    outletList: found ? found.retailers : [],
                };
            });

            // 5️⃣ Update state
            setAssignedEmployees(employeesWithOutletCounts);
            setFilteredEmployees(employeesWithOutletCounts);

            // 🆕 Fetch Employee–Retailer Mapping for Assigned Pairs Table
            const mappingForPairs = await fetchEmployeeRetailerMapping(selected.value);

            // 🆕 Flatten employee → retailer mapping into row pairs for table
            const assigned = [];

            mappingForPairs.forEach(emp => {
                if (Array.isArray(emp.retailers)) {
                    emp.retailers.forEach(ret => {
                        assigned.push({
                            employee: {
                                _id: emp._id,
                                name: emp.name,
                                employeeId: emp.employeeId,
                            },
                            retailer: {
                                _id: ret._id,
                                uniqueId: ret.uniqueId,
                                shopName: ret.shopDetails?.shopName,
                                state: ret.shopDetails?.shopAddress?.state,
                                shopDetails: ret.shopDetails
                            },
                            assignedAt: ret.assignedAt
                        });
                    });
                }
            });

            setAssignedPairs(assigned);
            setFilteredPairs(assigned);

        } catch (err) {
            toast.error("Server error. Try again.", { theme: "dark" });
        } finally {
            setLoadingAssignedData(false);
        }
    };

    const handleAssignEmployee = async () => {
        if (!selectedEmployee) {
            toast.error("Please select an employee", { theme: "dark" });
            return;
        }
        if (selectedRetailers.length === 0) {
            toast.error("Please select at least one retailer", { theme: "dark" });
            return;
        }

        if (!window.confirm(
            `Assign selected ${selectedRetailers.length} retailers to this employee?`
        )) return;

        const token = localStorage.getItem("token");

        for (const retailerId of selectedRetailers) {
            try {
                const res = await fetch(
                    `${API_URL}/admin/campaign/assign-employee-to-retailer`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            campaignId: selectedCampaign.value,
                            retailerId,
                            employeeId: selectedEmployee,
                        }),
                    }
                );

                const data = await res.json();

                if (!res.ok) {
                    toast.warn(data.message || "Assignment failed", {
                        theme: "dark",
                    });
                } else {
                    toast.success("Assigned Successfully!", { theme: "dark" });

                    // ✅ Update table UI with proper assigned status
                    setAssignedRetailers((prev) =>
                        prev.map((r) =>
                            r._id === retailerId
                                ? { ...r, status: "assigned", assignedEmployee: data.employee }
                                : r
                        )
                    );
                }
            } catch (err) {
                console.error("Assign error:", err);
                toast.error("Server error", { theme: "dark" });
            }
        }

        // Clear selection after assignment
        setSelectedRetailers([]);
    };

    const handleDownloadFilteredReport = () => {
        if (!filteredPairs.length) {
            toast.error("No data to download", { theme: "dark" });
            return;
        }

        // Convert filteredPairs → Excel row data
        const rows = filteredPairs.map((p, index) => ({
            SNo: index + 1,
            OutletCode: p.retailer.uniqueId,
            OutletName: p.retailer.shopName,
            State: p.retailer.state,
            EmployeeCode: p.employee.employeeId,
            EmployeeName: p.employee.name,
            AssignedAt: p.assignedAt
                ? new Date(p.assignedAt).toLocaleString()
                : "",
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(rows);

        // -----------------------------
        // STYLING DEFINITIONS
        // -----------------------------
        const headerStyle = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "E2E8F0" } } // Optional: light gray background
        };

        const dataStyle = {
            alignment: { horizontal: "center", vertical: "center" }
        };

        // -----------------------------
        // APPLY HEADER STYLES
        // -----------------------------
        const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1"];
        headerCells.forEach((cell) => {
            if (ws[cell]) {
                ws[cell].s = headerStyle;
            }
        });

        // -----------------------------
        // APPLY DATA CELL STYLES
        // -----------------------------
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (ws[cellAddress]) {
                    ws[cellAddress].s = dataStyle;
                }
            }
        }

        // -----------------------------
        // COLUMN WIDTHS
        // -----------------------------
        ws["!cols"] = [
            { wpx: 60 },   // S.No
            { wpx: 120 },  // Outlet Code
            { wpx: 180 },  // Outlet Name
            { wpx: 100 },  // State
            { wpx: 120 },  // Employee Code
            { wpx: 150 },  // Employee Name
            { wpx: 160 },  // Assigned At
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Filtered Mapping");

        // Download Excel
        XLSX.writeFile(
            wb,
            `employee_retailer_filtered_${selectedCampaign.value}.xlsx`
        );
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
                        Map Employee to Retailer
                    </h1>

                    <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-700">
                            Select Campaign *
                        </h2>
                        <Select
                            value={selectedCampaign}
                            onChange={handleCampaignChange}
                            options={campaigns}
                            isLoading={loadingCampaigns}
                            styles={customSelectStyles}
                            placeholder="Choose a campaign"
                            isSearchable
                            isClearable
                            className="max-w-md"
                        />
                        {selectedCampaign && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                                <p>
                                    <strong>Client:</strong> {selectedCampaign.data.client}
                                </p>
                                <p>
                                    <strong>Type:</strong> {selectedCampaign.data.type}
                                </p>
                                <p>
                                    <strong>Region(s):</strong>{" "}
                                    {Array.isArray(selectedCampaign.data.regions)
                                        ? selectedCampaign.data.regions.join(", ")
                                        : selectedCampaign.data.region || "N/A"}
                                </p>
                                <p>
                                    <strong>State(s):</strong>{" "}
                                    {Array.isArray(selectedCampaign.data.states)
                                        ? selectedCampaign.data.states.join(", ")
                                        : selectedCampaign.data.state || "N/A"}
                                </p>
                            </div>
                        )}
                    </div>

                    {selectedCampaign && (
                        <>
                            {/* Common State Filter */}
                            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                    Common Filter
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* 🏙️ State Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                        <Select
                                            value={stateFilter}
                                            onChange={setStateFilter}
                                            options={[...new Set([
                                                ...assignedRetailers.map(r => r?.shopDetails?.shopAddress?.state),
                                                ...assignedEmployees.map(e => e?.correspondenceAddress?.state)
                                            ])]
                                                .filter(Boolean)
                                                .map(s => ({ label: s, value: s }))
                                            }
                                            styles={customSelectStyles}
                                            placeholder="Select State"
                                            isClearable
                                        />
                                    </div>
                                </div>

                                {/* Clear Filter Button */}
                                {stateFilter && (
                                    <button
                                        onClick={() => setStateFilter(null)}
                                        className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                                    >
                                        Clear State Filter
                                    </button>
                                )}
                            </div>

                            {/* Retailer Table */}
                            <div className="bg-[#EDEDED] shadow-md rounded-lg p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                    Select Retailers ({filteredRetailers.length} of {assignedRetailers.length})
                                </h3>

                                {/* Retailer Search Bar */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search by Outlet Code or Outlet Name"
                                        value={searchRetailer}
                                        onChange={(e) => setSearchRetailer(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    />
                                    {searchRetailer && (
                                        <button
                                            onClick={() => setSearchRetailer("")}
                                            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                </div>

                                {loadingAssignedData ? (
                                    <p className="text-gray-500 py-3">Loading retailers and checking assignment status...</p>
                                ) : assignedRetailers.length === 0 ? (
                                    <p className="text-gray-500 py-3">No retailers assigned yet.</p>
                                ) : filteredRetailers.length === 0 ? (
                                    <p className="text-gray-500 py-3">No retailers match your filters.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Select</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">S.No</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Outlet Code</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Outlet Name</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Business Type</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">State</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredRetailers.map((r, i) => (
                                                    <tr key={r._id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="checkbox"
                                                                disabled={r.status?.toLowerCase() === "assigned"}
                                                                checked={selectedRetailers.includes(r._id)}
                                                                onChange={() => handleSelectRetailer(r._id)}
                                                                className={`w-4 h-4 cursor-pointer ${r.status?.toLowerCase() === "assigned"
                                                                    ? "cursor-not-allowed opacity-50"
                                                                    : ""
                                                                    }`}
                                                            />
                                                        </td>

                                                        <td className="px-4 py-2 text-sm">{i + 1}</td>

                                                        <td className="px-4 py-2 text-sm font-medium text-gray-700">
                                                            {r.uniqueId || "-"}
                                                        </td>

                                                        <td className="px-4 py-2 text-sm font-medium text-gray-700">
                                                            {r.shopDetails?.shopName || "-"}
                                                        </td>

                                                        <td className="px-4 py-2 text-sm text-gray-600">
                                                            {r.shopDetails?.businessType || "-"}
                                                        </td>

                                                        <td className="px-4 py-2 text-sm text-gray-600">
                                                            {r.shopDetails?.shopAddress?.state || "-"}
                                                        </td>

                                                        <td
                                                            className={`px-4 py-2 uppercase text-xs font-bold ${r.status?.toLowerCase() === "pending"
                                                                ? "text-yellow-600"
                                                                : r.status?.toLowerCase() === "assigned"
                                                                    ? "text-green-600"
                                                                    : "text-blue-600"
                                                                }`}
                                                        >
                                                            {r.status}
                                                        </td>
                                                    </tr>
                                                ))}

                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Employee Table */}
                            <div className="bg-[#EDEDED] shadow-md rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                    Select Employee ({filteredEmployees.length} of {assignedEmployees.length})
                                </h3>

                                {/* Employee Search Bar */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search by Employee Code or Employee Name"
                                        value={searchEmployee}
                                        onChange={(e) => setSearchEmployee(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    />
                                    {searchEmployee && (
                                        <button
                                            onClick={() => setSearchEmployee("")}
                                            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                </div>

                                {loadingAssignedData ? (
                                    <p className="text-gray-500 py-3">Loading...</p>
                                ) : assignedEmployees.length === 0 ? (
                                    <p className="text-gray-500 py-3">No employees assigned yet.</p>
                                ) : filteredEmployees.length === 0 ? (
                                    <p className="text-gray-500 py-3">No employees match your filters.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Code</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Outlets Assigned
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredEmployees.map((e, i) => (
                                                    <tr key={e._id || i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="radio"
                                                                name="employeeSelection"
                                                                checked={selectedEmployee === e._id}
                                                                onChange={() => handleSelectEmployee(e._id)}
                                                                className="w-4 h-4 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">{i + 1}</td>
                                                        <td className="px-4 py-2 text-sm font-medium text-gray-700">{e.employeeId || "-"}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700">{e.name}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{e.phone}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{e.correspondenceAddress?.state || "-"}</td>
                                                        <td className="px-4 py-2 text-sm font-semibold text-gray-700">
                                                            {e.outletCount}

                                                            {e.outletCount > 0 && (
                                                                <button
                                                                    onClick={() => setOpenOutletList(e)}
                                                                    className="ml-3 text-blue-600 underline text-xs hover:text-blue-800"
                                                                >
                                                                    View
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="text-right mt-6">
                                <button
                                    onClick={handleAssignEmployee}
                                    disabled={!selectedEmployee || selectedRetailers.length === 0}
                                    className={`px-6 py-3 rounded-lg font-semibold text-white transition
                ${!selectedEmployee || selectedRetailers.length === 0
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-red-600 hover:bg-red-700"
                                        }`}
                                >
                                    Assign Employee
                                </button>
                            </div>
                            <div className="bg-[#EDEDED] shadow-md rounded-lg p-6 mt-6">
                                {/* Header with Download Button */}
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-700">
                                        Assigned Employee-Retailer Pairs ({filteredPairs.length} of {assignedPairs.length})
                                    </h3>

                                    {/* Download Button at Top */}
                                    {filteredPairs.length > 0 && (
                                        <button
                                            onClick={handleDownloadFilteredReport}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                        >
                                            Download Report
                                        </button>
                                    )}
                                </div>

                                {/* State Filter for Assigned Pairs */}
                                <div className="mb-4 max-w-xs">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Filter by State
                                    </label>
                                    <Select
                                        value={pairStateFilter}
                                        onChange={setPairStateFilter}
                                        options={[
                                            ...new Set(assignedPairs.map(p => p.retailer?.state))
                                        ]
                                            .filter(Boolean)
                                            .map(s => ({ label: s, value: s }))}
                                        placeholder="Select State"
                                        isClearable
                                        styles={customSelectStyles}
                                    />
                                </div>

                                {/* Search Bar */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search by Outlet / Employee Code or Name"
                                        value={searchAssignedPairs}
                                        onChange={(e) => setSearchAssignedPairs(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    />
                                </div>

                                {/* Table or Empty State */}
                                {loadingAssignedData ? (
                                    <p className="text-gray-500 py-3">Loading...</p>
                                ) : assignedPairs.length === 0 ? (
                                    <p className="text-gray-500 py-3">
                                        No assignments found for this campaign.
                                    </p>
                                ) : filteredPairs.length === 0 ? (
                                    <p className="text-gray-500 py-3">
                                        No results match your filters.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        S.No
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Outlet Code
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Outlet Name
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        State
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Employee Code
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Employee Name
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredPairs.map((pair, index) => (
                                                    <tr
                                                        key={`${pair.retailer?._id}-${pair.employee?._id}-${index}`}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-4 py-2 text-sm">{index + 1}</td>
                                                        <td className="px-4 py-2 text-sm font-medium text-gray-700">
                                                            {pair.retailer.uniqueId}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                            {pair.retailer.shopName}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">
                                                            {pair.retailer.state || "-"}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm font-medium text-gray-700">
                                                            {pair.employee.employeeId}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                            {pair.employee.name}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {openOutletList && (
                                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center px-4 animate-fadeIn z-50">

                                    <div className="bg-[#EDEDED] w-full max-w-md rounded-xl shadow-xl p-6 border border-gray-200 animate-slideUp">

                                        {/* Header */}
                                        <h2 className="text-xl font-bold mb-4 text-gray-800">
                                            Outlets Assigned to
                                            <span className="text-red-600"> {openOutletList.name}</span>
                                        </h2>

                                        {/* Outlet List */}
                                        <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                            {openOutletList.outletList.map((o, i) => (
                                                <li
                                                    key={i}
                                                    className="p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition"
                                                >
                                                    <p className="font-semibold text-gray-800 text-sm">
                                                        {o.uniqueId || o.shopDetails?.uniqueId || "N/A"}
                                                    </p>

                                                    <p className="text-sm text-gray-700">
                                                        {o.shopDetails?.shopName || o.name}
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        {o.shopDetails?.shopAddress?.state}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Close Button */}
                                        <button
                                            onClick={() => setOpenOutletList(null)}
                                            className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default MapEmployee;