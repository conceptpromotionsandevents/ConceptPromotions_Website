import { useState } from "react"
import { FaCheck, FaTimes } from "react-icons/fa"

const RetailerCampaigns = ({ campaigns = [], onView }) => {
  // Dummy campaigns if no data is passed
  const demoCampaigns = [
    {
      id: 1,
      name: "Monte Carlo Campaign",
      startDate: "01-Apr-25",
      endDate: "15-Apr-25",
    },
    {
      id: 2,
      name: "ABCD Campaign",
      startDate: "10-Apr-25",
      endDate: "25-Apr-25",
    },
    {
      id: 3,
      name: "Winter Dhamaka 2025",
      startDate: "05-Apr-25",
      endDate: "20-Apr-25",
    },
  ]

  const campaignData = campaigns.length ? campaigns : demoCampaigns

  // Track accept/reject state
  const [status, setStatus] = useState({})

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-[#E4002B]">My Campaigns</h2>

      {campaignData.length === 0 ? (
        <p className="text-gray-600">No campaigns found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {campaignData.map((campaign) => (
            <div
              key={campaign.id}
              className="border border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{campaign.name}</h3>

              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Start:</span> {campaign.startDate}
              </p>

              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">End:</span> {campaign.endDate}
              </p>

              {/* VIEW DETAILS BUTTON */}
              <button
                className="w-full bg-[#E4002B] text-white py-2 rounded-md hover:bg-[#C00026] transition font-medium text-sm mb-3"
                onClick={() => onView?.(campaign.id)}
              >
                View Details
              </button>

              {/* STATUS MESSAGE */}
              {status[campaign.id] === "accepted" && (
                <p className="text-green-600 font-semibold flex items-center gap-2 text-sm mb-2">
                  <FaCheck className="text-sm" /> Campaign Accepted
                </p>
              )}

              {/* EMPLOYEE LIST (ONLY WHEN ACCEPTED) */}
              {status[campaign.id] === "accepted" && (
                <div className="mt-2 mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                  <p className="font-medium text-gray-700 mb-2">Assigned Employees:</p>

                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-semibold">Rohit Sharma</span> — 9876543210
                    </p>
                    <p>
                      <span className="font-semibold">Anjali Verma</span> — 9123456780
                    </p>
                  </div>
                </div>
              )}

              {/* REJECTED MESSAGE */}
              {status[campaign.id] === "rejected" && (
                <p className="text-red-600 font-semibold flex items-center gap-2 text-sm mb-3">
                  <FaTimes className="text-sm" /> Campaign Rejected
                </p>
              )}

              {/* ACCEPT + REJECT BUTTONS (SMALLER) */}
              {!status[campaign.id] && (
                <div className="flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-1.5 rounded-md text-xs hover:bg-green-700 transition"
                    onClick={() => setStatus((prev) => ({ ...prev, [campaign.id]: "accepted" }))}
                  >
                    <FaCheck /> Accept
                  </button>

                  <button
                    className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-1.5 rounded-md text-xs hover:bg-red-700 transition"
                    onClick={() => setStatus((prev) => ({ ...prev, [campaign.id]: "rejected" }))}
                  >
                    <FaTimes /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RetailerCampaigns
