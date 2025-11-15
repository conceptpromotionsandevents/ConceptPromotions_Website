import React from "react";

const OutletsAssigned = ({ campaign }) => {
  // Dummy data — replace with API
  const outlets = [
    { id: 1, name: "Monte Carlo - Model Town", city: "Ludhiana", assignedOn: "02-Apr-25" },
    { id: 2, name: "Monte Carlo - Mall Road", city: "Jalandhar", assignedOn: "03-Apr-25" },
    { id: 3, name: "Monte Carlo - Sector 17", city: "Chandigarh", assignedOn: "04-Apr-25" },
  ];

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-[#E4002B]">
        Outlets Assigned
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {outlets.map((outlet) => (
          <div
            key={outlet.id}
            className="p-4 border rounded-lg shadow-sm hover:shadow-md transition bg-white"
          >
            <h4 className="text-lg font-semibold">{outlet.name}</h4>
            <p className="text-gray-600 text-sm">{outlet.city}</p>

            <div className="mt-2 text-sm">
              <span className="font-medium text-gray-700">Assigned On:</span>
              <span className="ml-1 text-gray-800">{outlet.assignedOn}</span>
            </div>
          </div>
        ))}
      </div>

      {outlets.length === 0 && (
        <p className="text-gray-500 text-center">No outlets assigned.</p>
      )}
    </div>
  );
};

export default OutletsAssigned;
