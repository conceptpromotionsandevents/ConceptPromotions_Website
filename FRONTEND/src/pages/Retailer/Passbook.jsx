import React, { useState } from "react";
import Select from "react-select";

const Passbook = () => {
  const campaigns = ["Campaign A", "Campaign B", "Campaign C"];
  const dateFilters = ["Today", "Last 7 Days", "This Month", "Custom"];
  const extraFilters = ["Option 1", "Option 2", "Option 3"];

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [selectedExtra, setSelectedExtra] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const rows = [
    {
      date: "01-Apr-25",
      particulars: "Opening Balance",
      debit: "",
      credit: "",
      balance: "0.00",
    },
    {
      date: "10-Apr-25",
      particulars: "Monte Carlo Campaign",
      debit: "1000",
      credit: "",
      balance: "1000.00",
    },
    {
      date: "11-Apr-25",
      particulars: "ABCD Campaign",
      debit: "",
      credit: "1000",
      balance: "0.00",
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-[#E4002B]">Passbook</h2>

      {/* === FILTERS === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* Campaign Dropdown */}
        <Select
          options={campaigns.map((c) => ({ label: c, value: c }))}
          value={selectedCampaign}
          onChange={setSelectedCampaign}
          placeholder="Select Campaign"
          isSearchable
          styles={{
            control: (base) => ({
              ...base,
              borderColor: "#E4002B",
              boxShadow: "none",
              borderRadius: "8px",
            }),
          }}
        />

        {/* Date Dropdown */}
        <div>
          <Select
            options={dateFilters.map((d) => ({ label: d, value: d }))}
            value={selectedDateFilter}
            onChange={setSelectedDateFilter}
            placeholder="Select Date"
            isSearchable
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#E4002B",
                boxShadow: "none",
                borderRadius: "8px",
              }),
            }}
          />

          {/* Custom Date Range */}
          {selectedDateFilter?.value === "Custom" && (
            <div className="flex items-center gap-3 mt-2">
              <input
                type="date"
                className="border rounded-lg px-3 py-2 text-sm focus:ring-[#E4002B] focus:outline-none w-full"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span className="text-gray-600">to</span>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 text-sm focus:ring-[#E4002B] focus:outline-none w-full"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Extra Dropdown */}
        <Select
          options={extraFilters.map((x) => ({ label: x, value: x }))}
          value={selectedExtra}
          onChange={setSelectedExtra}
          placeholder="Extra Filter"
          isSearchable
          styles={{
            control: (base) => ({
              ...base,
              borderColor: "#E4002B",
              boxShadow: "none",
              borderRadius: "8px",
            }),
          }}
        />
      </div>

      {/* === TABLE === */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-black rounded-lg overflow-hidden">

          <thead>
            <tr className="bg-[#E4002B] text-white">
              <th className="border border-black px-3 py-2">Date</th>
              <th className="border border-black px-3 py-2">Particulars</th>
              <th className="border border-black px-3 py-2">Debit</th>
              <th className="border border-black px-3 py-2">Credit</th>
              <th className="border border-black px-3 py-2">Balance</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((item, i) => (
              <tr key={i} className="odd:bg-gray-100">
                <td className="border border-black px-3 py-2">{item.date}</td>
                <td className="border border-black px-3 py-2">{item.particulars}</td>

                {/* debit */}
                <td className="border border-black px-3 py-2 text-red-600">
                  {item.debit || "-"}
                </td>

                {/* credit */}
                <td className="border border-black px-3 py-2 text-green-600">
                  {item.credit || "-"}
                </td>

                <td className="border border-black px-3 py-2 font-medium">
                  {item.balance}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default Passbook;
