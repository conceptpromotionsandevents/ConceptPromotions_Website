import { useState, useEffect } from "react"
import { FaCheck, FaTimes } from "react-icons/fa"
import axios from "axios"
import CampaignDetails from "./CampaignDetails"
import { API_URL } from "../../url/base";

const RetailerCampaigns = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingCampaign, setUpdatingCampaign] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  // Fetch campaigns from backend
  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("retailer_token")
      if (!token) {
        setError("No authentication token found. Please login.")
        setLoading(false)
        return
      }

      // Build URL with optional status filter
      let url = `${API_URL}/retailer/campaigns`
      if (filter !== 'all') {
        url += `?status=${filter}`
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setCampaigns(response.data.campaigns || [])
      
    } catch (err) {
      console.error("Fetch campaigns error:", err)
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.")
      } else {
        setError(err.response?.data?.message || "Failed to fetch campaigns")
      }
    } finally {
      setLoading(false)
    }
  }

  // Update campaign status (accept/reject)
  const updateCampaignStatus = async (campaignId, newStatus) => {
    try {
      setUpdatingCampaign(campaignId)
      const token = localStorage.getItem("retailer_token")
      
      await axios.put(
        `${API_URL}/retailer/campaigns/${campaignId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Refresh campaigns list after successful update
      await fetchCampaigns()
      
    } catch (err) {
      console.error("Update status error:", err)
      const errorMsg = err.response?.data?.message || err.message
      alert(`Failed to ${newStatus} campaign: ${errorMsg}`)
    } finally {
      setUpdatingCampaign(null)
    }
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return "Invalid date"
    }
  }

  // Fetch campaigns on mount and when filter changes
  useEffect(() => {
    fetchCampaigns()
  }, [filter])

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex justify-center items-center py-12 text-gray-200">
        Loading campaigns...
      </div>
    )
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
            <p className="text-gray-200 text-sm">View and manage your assigned campaigns</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {['all', 'pending', 'accepted', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors capitalize cursor-pointer ${
                  filter === tab
                    ? 'border-b-2 border-[#E4002B] text-[#E4002B]'
                    : 'text-gray-200 hover:text-gray-400'
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
            <p className="text-sm text-gray-200">
              {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'} found
            </p>
          </div>

          {/* Campaign Cards */}
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-200">No campaigns assigned.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {campaigns.map((campaign) => {
                const status = campaign.retailerStatus?.status || 'pending'
                
                return (
                  <div
                    key={campaign._id}
                    className="border border-black bg-[#EDEDED] rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
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
                            {campaign.client}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Start Date:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(campaign.retailerStatus?.startDate || campaign.campaignStartDate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">End Date:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(campaign.retailerStatus?.endDate || campaign.campaignEndDate)}
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
                            className={`flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-md text-sm hover:bg-green-700 transition cursor-pointer ${
                              updatingCampaign === campaign._id ? 'opacity-50 cursor-not-allowed' : ''
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
                            className={`flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded-md text-sm hover:bg-red-700 transition cursor-pointer ${
                              updatingCampaign === campaign._id ? 'opacity-50 cursor-not-allowed' : ''
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
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default RetailerCampaigns
