import React from "react";

const Info = ({ campaign }) => {
  // Debug
  console.log("Info component - campaign data:", campaign);
  console.log("Info banners:", campaign?.info?.banners);

  if (!campaign) {
    return <div className="text-center text-gray-500">No campaign data available</div>;
  }

  // Extract data
  const campaignInfo = campaign.info || {};
  const description = campaignInfo.description || "";
  const tnc = campaignInfo.tnc || "";
  const banners = campaignInfo.banners || [];

  console.log("Extracted banners:", banners);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-[#E4002B] border-b-2 border-[#E4002B] pb-2">
        Campaign Info
      </h3>

      {/* Basic Details */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
        <div className="flex items-start">
          <span className="font-semibold text-gray-700 min-w-[100px]">Client:</span>
          <span className="text-gray-900">{campaign.client || "N/A"}</span>
        </div>

        <div className="flex items-start">
          <span className="font-semibold text-gray-700 min-w-[100px]">Type:</span>
          <span className="text-gray-900">{campaign.type || "N/A"}</span>
        </div>

        <div className="flex items-start">
          <span className="font-semibold text-gray-700 min-w-[100px]">Start Date:</span>
          <span className="text-gray-900">{campaign.startDate || "N/A"}</span>
        </div>

        <div className="flex items-start">
          <span className="font-semibold text-gray-700 min-w-[100px]">End Date:</span>
          <span className="text-gray-900">{campaign.endDate || "N/A"}</span>
        </div>

        <div className="flex items-start">
          <span className="font-semibold text-gray-700 min-w-[100px]">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            campaign.status === 'accepted' ? 'bg-green-100 text-green-700' :
            campaign.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {campaign.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : "N/A"}
          </span>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Description</h4>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>
      )}

      {/* Campaign Banners - Simple Display */}
      {banners && banners.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Campaign Banners</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banners.map((banner, index) => {
              const imageUrl = banner?.url || banner;
              console.log(`Banner ${index}:`, imageUrl);
              
              return (
                <div key={banner?.publicId || index} className="rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                  <img
                    src={imageUrl}
                    alt={`Campaign Banner ${index + 1}`}
                    className="w-full h-auto object-contain bg-gray-50"
                    onError={(e) => {
                      console.error(`Failed to load banner ${index}:`, imageUrl);
                      e.target.src = 'https://via.placeholder.com/600x300?text=Image+Not+Available';
                    }}
                    onLoad={() => console.log(`Banner ${index} loaded successfully`)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      {tnc && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Terms & Conditions</h4>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded border-l-4 border-[#E4002B]">
            {tnc}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!description && !tnc && (!banners || banners.length === 0) && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">No additional campaign information available.</p>
        </div>
      )}
    </div>
  );
};

export default Info;
