import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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

const ScheduleUnscheduleTask = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    const [assignedPairs, setAssignedPairs] = useState([]);
    const [filteredPairs, setFilteredPairs] = useState([]);
    const [loadingAssignedData, setLoadingAssignedData] = useState(false);

    // Filters
    const [stateFilter, setStateFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [openModal, setOpenModal] = useState(false);
    const [currentPair, setCurrentPair] = useState(null);
    const [visits, setVisits] = useState([]);

    const [form, setForm] = useState({
        visitDate: "",
        visitType: "Visit",
        notes: "",
        isRecurring: "No",
        recurrenceInterval: "",
        lastVisitDate: "",
    });


    const [editingId, setEditingId] = useState(null);

    // Fetch Campaigns
    useEffect(() => {
        fetchCampaigns();
    }, []);

    // Add this useEffect in your component
    useEffect(() => {
        if (openModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [openModal]);

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

    const fetchVisits = async (pair) => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${API_URL}/admin/campaign/${selectedCampaign.value}/visit-schedules`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error("Failed to load visits");
                return;
            }

            const filtered = data.visits.filter(
                (v) =>
                    v.employeeId?._id === pair.employee._id &&
                    v.retailerId?._id === pair.retailer._id
            );

            setVisits(filtered);
        } catch (error) {
            toast.error("Error fetching visits");
        }
    };

    const createVisit = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${API_URL}/admin/visit-schedule/assign`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        campaignId: selectedCampaign.value,
                        employeeId: currentPair.employee._id,
                        retailerId: currentPair.retailer._id,
                        ...form,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error creating visit");
                return;
            }

            toast.success("Visit created");
            fetchVisits(currentPair);
            setOpenModal(false); // Add this line
            setEditingId(null);
        } catch (error) {
            toast.error("Server error");
        }
    };

    const updateVisit = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${API_URL}/admin/visit-schedule/update/${editingId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(form),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error updating visit");
                return;
            }

            toast.success("Visit updated");
            setEditingId(null);
            fetchVisits(currentPair);
            setOpenModal(false);
        } catch (error) {
            toast.error("Server error");
        }
    };

    const deleteVisit = async (id) => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${API_URL}/admin/visit-schedule/delete/${id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error deleting visit");
                return;
            }

            toast.success("Visit deleted");
            fetchVisits(currentPair);
            setOpenModal(false); // Add this line
            setEditingId(null);
        } catch (error) {
            toast.error("Server error");
        }
    };

    const handleCampaignChange = async (selected) => {
        setSelectedCampaign(selected);

        if (!selected) {
            setAssignedPairs([]);
            setFilteredPairs([]);
            setStateFilter(null);
            setSearchQuery("");
            return;
        }

        setLoadingAssignedData(true);
        setAssignedPairs([]);
        setFilteredPairs([]);
        setStateFilter(null);
        setSearchQuery("");

        try {
            const token = localStorage.getItem("token");

            // Use the correct endpoint
            const res = await fetch(
                `${API_URL}/admin/campaign/${selected.value}/employee-retailer-mapping`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error loading campaign data", {
                    theme: "dark",
                });
                return;
            }

            // Transform the nested structure into flat pairs
            const pairs = [];

            if (data.employees && Array.isArray(data.employees)) {
                data.employees.forEach((employee) => {
                    if (
                        employee.retailers &&
                        Array.isArray(employee.retailers)
                    ) {
                        employee.retailers.forEach((retailer) => {
                            pairs.push({
                                employee: {
                                    _id: employee._id,
                                    employeeId: employee.employeeId,
                                    name: employee.name,
                                    email: employee.email,
                                    phone: employee.phone,
                                    position: employee.position,
                                },
                                retailer: {
                                    _id: retailer._id,
                                    uniqueId: retailer.uniqueId,
                                    name: retailer.name,
                                    contactNo: retailer.contactNo,
                                    shopDetails: retailer.shopDetails,
                                },
                                assignedAt: retailer.assignedAt,
                            });
                        });
                    }
                });
            }

            setAssignedPairs(pairs);
            setFilteredPairs(pairs);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Server error. Try again.", { theme: "dark" });
        } finally {
            setLoadingAssignedData(false);
        }
    };

    // Filter pairs based on state and search query
    useEffect(() => {
        if (!assignedPairs.length) {
            setFilteredPairs([]);
            return;
        }

        let filtered = [...assignedPairs];

        // State Filter
        if (stateFilter) {
            filtered = filtered.filter(
                (pair) =>
                    pair.retailer?.shopDetails?.shopAddress?.state ===
                    stateFilter.value
            );
        }

        // Search Filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (pair) =>
                    pair.retailer?.uniqueId?.toLowerCase().includes(query) ||
                    pair.retailer?.shopDetails?.shopName
                        ?.toLowerCase()
                        .includes(query) ||
                    pair.employee?.employeeId?.toLowerCase().includes(query) ||
                    pair.employee?.name?.toLowerCase().includes(query)
            );
        }

        setFilteredPairs(filtered);
    }, [stateFilter, searchQuery, assignedPairs]);

    const handleTaskClick = async (pair) => {
        setCurrentPair(pair);
        setOpenModal(true);
        setEditingId(null);
        setForm({ visitDate: "", visitType: "", notes: "" });
        fetchVisits(pair);
    };;

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
                        Schedule / Unschedule Task
                    </h1>

                    {/* Campaign Selection */}
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
                                    <strong>Client:</strong>{" "}
                                    {selectedCampaign.data.client}
                                </p>
                                <p>
                                    <strong>Type:</strong>{" "}
                                    {selectedCampaign.data.type}
                                </p>
                                <p>
                                    <strong>Region(s):</strong>{" "}
                                    {Array.isArray(
                                        selectedCampaign.data.regions
                                    )
                                        ? selectedCampaign.data.regions.join(
                                            ", "
                                        )
                                        : selectedCampaign.data.region || "N/A"}
                                </p>
                                <p>
                                    <strong>State(s):</strong>{" "}
                                    {Array.isArray(selectedCampaign.data.states)
                                        ? selectedCampaign.data.states.join(
                                            ", "
                                        )
                                        : selectedCampaign.data.state || "N/A"}
                                </p>
                            </div>
                        )}
                    </div>

                    {selectedCampaign && (
                        <>
                            {/* Filters */}
                            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                    Filters
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* State Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State
                                        </label>
                                        <Select
                                            value={stateFilter}
                                            onChange={setStateFilter}
                                            options={[
                                                ...new Set(
                                                    assignedPairs
                                                        .map(
                                                            (pair) =>
                                                                pair.retailer
                                                                    ?.shopDetails
                                                                    ?.shopAddress
                                                                    ?.state
                                                        )
                                                        .filter(Boolean)
                                                ),
                                            ].map((s) => ({
                                                label: s,
                                                value: s,
                                            }))}
                                            styles={customSelectStyles}
                                            placeholder="Select State"
                                            isClearable
                                        />
                                    </div>

                                    {/* Search Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Search
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search by Outlet/Employee Code or Name"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {(stateFilter || searchQuery) && (
                                    <button
                                        onClick={() => {
                                            setStateFilter(null);
                                            setSearchQuery("");
                                        }}
                                        className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>

                            {/* Assigned Pairs Table */}
                            <div className="bg-[#EDEDED] shadow-md rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                    Assigned Employee-Retailer Pairs (
                                    {filteredPairs.length} of{" "}
                                    {assignedPairs.length})
                                </h3>

                                {loadingAssignedData ? (
                                    <p className="text-gray-500 py-3">
                                        Loading...
                                    </p>
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
                                                        Employee Code
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Employee Name
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Visit Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredPairs.map(
                                                    (pair, index) => (
                                                        <tr
                                                            key={`${pair.retailer?._id}-${pair.employee?._id}-${index}`}
                                                            className="hover:bg-gray-50"
                                                        >
                                                            <td className="px-4 py-2 text-sm">
                                                                {index + 1}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-medium text-gray-700">
                                                                {pair.retailer
                                                                    ?.uniqueId ||
                                                                    "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                                {pair.retailer
                                                                    ?.shopDetails
                                                                    ?.shopName ||
                                                                    "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-medium text-gray-700">
                                                                {pair.employee
                                                                    ?.employeeId ||
                                                                    "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                                {pair.employee
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <button
                                                                    onClick={() =>
                                                                        handleTaskClick(
                                                                            pair
                                                                        )
                                                                    }
                                                                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition cursor-pointer"
                                                                >
                                                                    Manage Visit
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                {openModal && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center px-4 z-50"
                        onClick={(e) => {
                            // Close modal when clicking on backdrop
                            if (e.target === e.currentTarget) {
                                setOpenModal(false);
                                setEditingId(null);
                            }
                        }}
                        style={{ overflow: 'hidden' }}
                    >

                        <div className="bg-[#EDEDED] w-full max-w-2xl rounded-xl shadow-2xl p-6 border border-red-600 max-h-[90vh] overflow-y-auto">

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-red-600/30">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {editingId ? "Update Visit" : "Create Visit"}
                                </h2>
                                <button
                                    onClick={() => {
                                        setOpenModal(false);
                                        setEditingId(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-800 transition"
                                >
                                    <svg className="w-6 h-6 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Visit Date */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-red-600 mb-2">Visit Date *</label>
                                <input
                                    type="date"
                                    value={form.visitDate}
                                    onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition"
                                />
                            </div>

                            {/* Visit Type */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-red-600 mb-2">Visit Type</label>
                                <select
                                    value={form.visitType}
                                    onChange={(e) => setForm({ ...form, visitType: e.target.value })}
                                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition"
                                >
                                    <option>Visit</option>
                                    <option>Audit</option>
                                    <option>Follow-Up</option>
                                    <option>Collection</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-red-600 mb-2">Notes</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition resize-none"
                                    placeholder="Write notes..."
                                    rows="3"
                                ></textarea>
                            </div>

                            {/* Is Recurring */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-red-600 mb-2">Is Recurring?</label>
                                <select
                                    value={form.isRecurring}
                                    onChange={(e) => {
                                        setForm({ ...form, isRecurring: e.target.value });
                                        if (e.target.value === "No") {
                                            setForm((prev) => ({ ...prev, recurrenceInterval: "" }));
                                        }
                                    }}
                                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition"
                                >
                                    <option>No</option>
                                    <option>Yes</option>
                                </select>
                            </div>

                            {/* Recurrence Interval */}
                            {form.isRecurring === "Yes" && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-red-600 mb-2">Recurrence Interval</label>
                                        <select
                                            value={form.recurrenceInterval}
                                            onChange={(e) =>
                                                setForm({ ...form, recurrenceInterval: e.target.value })
                                            }
                                            className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition"
                                        >
                                            <option value="">Select interval</option>
                                            <option>Daily</option>
                                            <option>Weekly</option>
                                            <option>Fortnightly</option>
                                            <option>Monthly</option>
                                        </select>
                                    </div>

                                    {/* Last Visit Date */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-red-600 mb-2">Last Visit Date</label>
                                        <input
                                            type="date"
                                            value={form.lastVisitDate}
                                            onChange={(e) =>
                                                setForm({ ...form, lastVisitDate: e.target.value })
                                            }
                                            className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    className="flex-1 px-6 py-3 bg-gray-400 hover:bg-gray-500 text-gray-800 font-semibold rounded-lg transition shadow-lg cursor-pointer"
                                    onClick={() => {
                                        setOpenModal(false);
                                        setEditingId(null);
                                    }}
                                >
                                    Cancel
                                </button>

                                {editingId ? (
                                    <button
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition shadow-lg"
                                        onClick={updateVisit}
                                    >
                                        Update Visit
                                    </button>
                                ) : (
                                    <button
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition shadow-lg cursor-pointer"
                                        onClick={createVisit}
                                    >
                                        Create Visit
                                    </button>
                                )}
                            </div>

                            {/* Visit History */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Visit History
                                </h3>

                                {visits.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-sm">No visits scheduled yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {visits.map((v) => (
                                            <div key={v._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-red-600/50 transition">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-base">{v.visitType}</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {new Date(v.visitDate).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                        {v.notes && (
                                                            <p className="text-sm text-gray-700 mt-2">{v.notes}</p>
                                                        )}
                                                        {v.isRecurring === "Yes" && (
                                                            <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded font-medium">
                                                                {v.recurrenceInterval}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-200">
                                                    <button
                                                        className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium transition"
                                                        onClick={() => {
                                                            setEditingId(v._id);
                                                            setForm({
                                                                visitDate: v.visitDate?.slice(0, 10),
                                                                visitType: v.visitType,
                                                                notes: v.notes || "",
                                                                isRecurring: v.isRecurring,
                                                                recurrenceInterval: v.recurrenceInterval || "",
                                                                lastVisitDate: v.lastVisitDate?.slice(0, 10) || "",
                                                            });
                                                        }}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="flex items-center gap-1 text-gray-600 hover:text-red-600 text-sm font-medium transition"
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this visit?')) {
                                                                deleteVisit(v._id);
                                                            }
                                                        }}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </>
    );
};

export default ScheduleUnscheduleTask;
