import { useState, useEffect } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import axios from "axios";
import CampaignDetails from "./CampaignDetails";
import { API_URL } from "../../url/base";

const EmployeeCampaign = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingCampaign, setUpdatingCampaign] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Get employee status from campaign (now it's added by backend)
  const getEmployeeStatus = (campaign) => {
    // Backend now adds employeeStatus at the top level
    return campaign.employeeStatus?.status || 'pending';
  };

  // Fetch campaigns from backend
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/employee/employee/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchedCampaigns = response.data.campaigns || [];
      setAllCampaigns(fetchedCampaigns);

      // Apply filter on frontend
      filterCampaigns(fetchedCampaigns, filter);

    } catch (err) {
      console.error("Fetch campaigns error:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch campaigns");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter campaigns based on status
  const filterCampaigns = (campaignsToFilter, filterType) => {
    if (filterType === 'all') {
      setCampaigns(campaignsToFilter);
    } else {
      const filtered = campaignsToFilter.filter(campaign => {
        const status = getEmployeeStatus(campaign);
        return status === filterType;
      });
      setCampaigns(filtered);
    }
  };

  // Update campaign status (accept/reject)
  const updateCampaignStatus = async (campaignId, newStatus) => {
    try {
      setUpdatingCampaign(campaignId);
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_URL}/employee/employee/campaigns/${campaignId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh campaigns list after successful update
      await fetchCampaigns();

    } catch (err) {
      console.error("Update status error:", err);
      const errorMsg = err.response?.data?.message || err.message;
      alert(`Failed to ${newStatus} campaign: ${errorMsg}`);
    } finally {
      setUpdatingCampaign(null);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  };

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Apply filter when filter changes
  useEffect(() => {
    filterCampaigns(allCampaigns, filter);
  }, [filter, allCampaigns]);

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex justify-center items-center py-12 text-gray-200">
        Loading campaigns...
      </div>
    );
  }

  return (
    <div>
      {selectedCampaign ? (
        <CampaignDetails
          campaignId={selectedCampaign._id}
          campaign={selectedCampaign}
          onBack={() => setSelectedCampaign(null)}
        />
      ) : (
        <>
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#E4002B] mb-2">My Campaigns</h2>
            <p className="text-white text-sm">View and manage your assigned campaigns</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {['all', 'pending', 'accepted', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors capitalize cursor-pointer ${filter === tab
                    ? 'border-b-2 border-[#E4002B] text-[#E4002B]'
                    : 'text-white hover:text-gray-400'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
              {error}
              <button
                onClick={fetchCampaigns}
                className="ml-4 text-red-600 hover:underline font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Campaign Count */}
          <div className="mb-4">
            <p className="text-sm text-white">
              {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'} found
            </p>
          </div>

          {/* Campaign Cards */}
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-200">
                {filter === 'all'
                  ? 'No campaigns assigned.'
                  : `No ${filter} campaigns found.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {campaigns.map((campaign) => {
                const status = getEmployeeStatus(campaign);

                return (
                  <div
                    key={campaign._id}
                    className="border border-black rounded-lg shadow-sm hover:shadow-md transition overflow-hidden bg-[#EDEDED]"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-[#E4002B] to-[#C00026] px-6 py-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-white line-clamp-2">
                          {campaign.name}
                        </h3>
                        {!campaign.isActive && (
                          <span className="px-2 py-1 bg-white/20 text-white text-xs rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      {/* Campaign Details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Campaign Type:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {campaign.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Client:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {campaign.client || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Start Date:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(campaign.employeeStatus?.startDate || campaign.campaignStartDate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">End Date:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(campaign.employeeStatus?.endDate || campaign.campaignEndDate)}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex justify-center pt-2">
                        {status === 'accepted' && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-300 rounded-full text-xs font-medium flex items-center gap-1">
                            <FaCheck /> Accepted
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-xs font-medium flex items-center gap-1">
                            <FaTimes /> Rejected
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full text-xs font-medium">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer - Action Buttons */}
                    <div className="px-6 pb-6">
                      {/* VIEW DETAILS - ONLY FOR ACCEPTED */}
                      {status === 'accepted' && (
                        <button
                          className="w-full bg-[#E4002B] text-white py-2 rounded-md hover:bg-[#C00026] transition font-medium text-sm cursor-pointer"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          View Details
                        </button>
                      )}

                      {/* ACCEPT/REJECT BUTTONS - ONLY FOR PENDING */}
                      {status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            className={`flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-md text-sm hover:bg-green-700 transition cursor-pointer ${updatingCampaign === campaign._id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            onClick={() => updateCampaignStatus(campaign._id, "accepted")}
                            disabled={updatingCampaign === campaign._id}
                          >
                            {updatingCampaign === campaign._id ? (
                              <>Processing...</>
                            ) : (
                              <>
                                <FaCheck /> Accept
                              </>
                            )}
                          </button>

                          <button
                            className={`flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded-md text-sm hover:bg-red-700 transition cursor-pointer ${updatingCampaign === campaign._id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            onClick={() => updateCampaignStatus(campaign._id, "rejected")}
                            disabled={updatingCampaign === campaign._id}
                          >
                            {updatingCampaign === campaign._id ? (
                              <>Processing...</>
                            ) : (
                              <>
                                <FaTimes /> Reject
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* NO ACTION FOR REJECTED */}
                      {status === 'rejected' && (
                        <div className="text-center py-2">
                          <p className="text-sm text-gray-500 italic">
                            Campaign rejected
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeCampaign;
