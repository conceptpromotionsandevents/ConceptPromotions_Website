import React from "react";

const TrackProgress = ({ onViewVisit }) => {

    // Dummy example data
    const visitData = [
        {
            id: 1,
            retailerName: "ABC Store",
            typeOfVisit: "Scheduled",
            attended: false,
            reason: "Outlet Closed",
            summary: "",
            lastVisit: "NA",
            upcomingVisit: "20-Nov-25",
        },
        {
            id: 2,
            retailerName: "Fashion Hub",
            typeOfVisit: "Unscheduled",
            attended: true,
            reason: "",
            summary: "Stock checked & display updated",
            lastVisit: "10-Nov-25",
            upcomingVisit: "18-Nov-25",
        },
        {
            id: 3,
            retailerName: "City Trends",
            typeOfVisit: "Scheduled",
            attended: true,
            reason: "",
            summary: "Merchandising verified",
            lastVisit: "08-Nov-25",
            upcomingVisit: "16-Nov-25",
        },
    ];

    return (
        <div className="p-6 bg-white shadow rounded-lg">
            <h2 className="text-2xl font-bold text-[#E4002B] mb-6">Track Progress</h2>

            {/* TABLE EXACTLY LIKE REPORT COMPONENT */}
            <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead className="bg-[#E4002B] text-white">
                        <tr>
                            <th className="p-3 w-1/4">Retailer Name</th>
                            <th className="p-3 w-1/4">Last Visit</th>
                            <th className="p-3 w-1/4">Upcoming Visit</th>
                            <th className="p-3 w-1/4">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {visitData.map((row) => (
                            <tr key={row.id} className="border-b hover:bg-gray-100">
                                <td className="p-3 w-1/4">{row.retailerName}</td>
                                <td className="p-3 w-1/4">{row.lastVisit}</td>
                                <td className="p-3 w-1/4">{row.upcomingVisit}</td>
                                <td className="p-3 w-1/4">
                                    <button
                                        className="bg-[#E4002B] text-white px-4 py-1 rounded hover:bg-red-700 transition cursor-pointer"
                                        onClick={() => onViewVisit(row)}
                                    >
                                        View Last Visit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default TrackProgress;
